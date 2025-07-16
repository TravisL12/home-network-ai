const axios = require('axios');

class OllamaService {
  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.defaultModel = 'llama2';
  }

  async getStatus() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      return {
        status: 'healthy',
        models: response.data.models || [],
        baseUrl: this.baseUrl
      };
    } catch (error) {
      console.error('Ollama status check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        baseUrl: this.baseUrl
      };
    }
  }

  async getModels() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      return response.data.models || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  async pullModel(modelName) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/pull`, {
        name: modelName
      });
      
      return { success: true, model: modelName };
    } catch (error) {
      console.error(`Error pulling model ${modelName}:`, error);
      throw error;
    }
  }

  async generateResponse(prompt, context = [], model = this.defaultModel) {
    try {
      const contextString = this.formatContext(context);
      const fullPrompt = this.buildPrompt(prompt, contextString);

      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: model,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000
        }
      });

      return {
        response: response.data.response,
        model: model,
        context: response.data.context,
        metadata: {
          prompt_eval_count: response.data.prompt_eval_count,
          eval_count: response.data.eval_count,
          total_duration: response.data.total_duration
        }
      };
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  async generateStreamResponse(prompt, context = [], model = this.defaultModel) {
    try {
      const contextString = this.formatContext(context);
      const fullPrompt = this.buildPrompt(prompt, contextString);

      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: model,
        prompt: fullPrompt,
        stream: true,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000
        }
      }, {
        responseType: 'stream'
      });

      return response.data;
    } catch (error) {
      console.error('Error generating stream response:', error);
      throw error;
    }
  }

  formatContext(context) {
    if (!context || context.length === 0) {
      return '';
    }

    let contextString = '\n\nRelevant context from your knowledge base:\n\n';
    
    if (context.documents && context.documents.length > 0) {
      contextString += 'Documents:\n';
      context.documents.forEach((doc, index) => {
        contextString += `${index + 1}. ${doc.title || 'Untitled'}\n`;
        contextString += `   ${doc.content.substring(0, 500)}${doc.content.length > 500 ? '...' : ''}\n\n`;
      });
    }

    if (context.images && context.images.length > 0) {
      contextString += 'Images with extracted text:\n';
      context.images.forEach((img, index) => {
        if (img.extractedText && img.extractedText.trim()) {
          contextString += `${index + 1}. ${img.filename}\n`;
          contextString += `   ${img.extractedText.substring(0, 300)}${img.extractedText.length > 300 ? '...' : ''}\n\n`;
        }
      });
    }

    return contextString;
  }

  buildPrompt(userQuestion, context) {
    const systemPrompt = `You are a helpful AI assistant with access to a personal knowledge base. You can search through documents, images, and extracted text to provide accurate and relevant answers.

Instructions:
- Use the provided context to answer questions accurately
- If the context doesn't contain relevant information, say so clearly
- Be concise but thorough in your responses
- Reference specific documents or images when relevant
- If asked about images, mention what was extracted from them via OCR

${context}

User Question: ${userQuestion}

Response:`;

    return systemPrompt;
  }

  async trainModel(modelName, trainingData) {
    try {
      const modelfile = this.createModelfile(modelName, trainingData);
      
      const response = await axios.post(`${this.baseUrl}/api/create`, {
        name: modelName,
        modelfile: modelfile
      });

      return { success: true, model: modelName };
    } catch (error) {
      console.error(`Error training model ${modelName}:`, error);
      throw error;
    }
  }

  createModelfile(modelName, trainingData) {
    let modelfile = `FROM ${this.defaultModel}\n\n`;
    
    if (trainingData.systemPrompt) {
      modelfile += `SYSTEM "${trainingData.systemPrompt}"\n\n`;
    }

    if (trainingData.examples && trainingData.examples.length > 0) {
      trainingData.examples.forEach(example => {
        modelfile += `USER "${example.input}"\n`;
        modelfile += `ASSISTANT "${example.output}"\n\n`;
      });
    }

    if (trainingData.parameters) {
      Object.entries(trainingData.parameters).forEach(([key, value]) => {
        modelfile += `PARAMETER ${key} ${value}\n`;
      });
    }

    return modelfile;
  }

  async deleteModel(modelName) {
    try {
      await axios.delete(`${this.baseUrl}/api/delete`, {
        data: { name: modelName }
      });
      
      return { success: true };
    } catch (error) {
      console.error(`Error deleting model ${modelName}:`, error);
      throw error;
    }
  }

  async createCustomModel(modelName, baseModel, customInstructions, documentContext = []) {
    try {
      const contextString = this.formatContext(documentContext);
      
      const systemPrompt = `You are a specialized AI assistant trained on a personal knowledge base. ${customInstructions}

Knowledge Base Context:
${contextString}

Always reference the knowledge base when answering questions and be specific about which documents or images contain the information you're using.`;

      const trainingData = {
        systemPrompt: systemPrompt,
        parameters: {
          temperature: 0.7,
          top_p: 0.9,
          repeat_penalty: 1.1
        }
      };

      const result = await this.trainModel(modelName, trainingData);
      return result;
    } catch (error) {
      console.error(`Error creating custom model ${modelName}:`, error);
      throw error;
    }
  }
}

module.exports = new OllamaService();