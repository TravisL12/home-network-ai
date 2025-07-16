const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');

const ollamaService = require('./services/ollama');
const weaviateService = require('./services/weaviate');
const ocrService = require('./services/ocr');
const imageService = require('./services/image');
const documentService = require('./services/document');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    fieldSize: 50 * 1024 * 1024, // 50MB field limit
  },
  storage: multer.memoryStorage(),
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'Home Network AI is running!' });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    // Check if models are available
    const models = await ollamaService.getModels();
    if (!models || models.length === 0) {
      // Provide a fallback response while models are downloading
      const searchResults = await weaviateService.search(message);
      let fallbackResponse = "I'm currently downloading AI models in the background. ";
      
      if (searchResults.documents && searchResults.documents.length > 0) {
        fallbackResponse += "However, I found some relevant documents in your knowledge base:\n\n";
        searchResults.documents.slice(0, 3).forEach((doc, index) => {
          fallbackResponse += `${index + 1}. ${doc.title || 'Untitled Document'}\n`;
          fallbackResponse += `   ${doc.content.substring(0, 200)}...\n\n`;
        });
      } else if (searchResults.images && searchResults.images.length > 0) {
        fallbackResponse += "However, I found some relevant images in your knowledge base:\n\n";
        searchResults.images.slice(0, 3).forEach((img, index) => {
          if (img.extractedText) {
            fallbackResponse += `${index + 1}. ${img.filename}\n`;
            fallbackResponse += `   ${img.extractedText.substring(0, 200)}...\n\n`;
          }
        });
      } else {
        fallbackResponse += "Please try again in a few minutes once the models are fully downloaded.";
      }
      
      return res.json({ response: fallbackResponse });
    }
    
    const searchResults = await weaviateService.search(message);
    const response = await ollamaService.generateResponse(message, searchResults);
    
    res.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    
    // Check if it's a model-not-found error
    if (error.response && error.response.data && error.response.data.error && error.response.data.error.includes('not found')) {
      // Provide search results as fallback
      try {
        const searchResults = await weaviateService.search(req.body.message);
        let fallbackResponse = "AI model is still downloading. Here's what I found in your knowledge base:\n\n";
        
        if (searchResults.documents && searchResults.documents.length > 0) {
          searchResults.documents.slice(0, 3).forEach((doc, index) => {
            fallbackResponse += `${index + 1}. ${doc.title || 'Untitled Document'}\n`;
            fallbackResponse += `   ${doc.content.substring(0, 200)}...\n\n`;
          });
        } else {
          fallbackResponse += "No relevant documents found. Please try again once the AI model is fully downloaded.";
        }
        
        return res.json({ response: fallbackResponse });
      } catch (searchError) {
        return res.status(503).json({ 
          error: 'AI model not available. Please wait for model download to complete.',
          suggestion: 'Models are being downloaded in the background. Please try again in a few minutes.'
        });
      }
    }
    
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

app.post('/api/ingest/document', async (req, res) => {
  try {
    const result = await documentService.ingestDocument(req.body);
    res.json(result);
  } catch (error) {
    console.error('Document ingestion error:', error);
    res.status(500).json({ error: 'Failed to ingest document' });
  }
});

app.post('/api/upload/files', upload.array('files'), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];
    for (const file of files) {
      try {
        const result = await documentService.ingestDocument({
          title: file.originalname,
          content: file.buffer.toString('utf8'),
          filePath: file.originalname,
          fileType: path.extname(file.originalname).toLowerCase(),
        });
        results.push({
          filename: file.originalname,
          success: true,
          result: result,
        });
      } catch (error) {
        results.push({
          filename: file.originalname,
          success: false,
          error: error.message,
        });
      }
    }

    res.json({
      totalFiles: files.length,
      processed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results: results,
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

app.post('/api/scan/images', async (req, res) => {
  try {
    const result = await imageService.scanImages();
    res.json(result);
  } catch (error) {
    console.error('Image scanning error:', error);
    res.status(500).json({ error: 'Failed to scan images' });
  }
});

app.get('/api/status', async (req, res) => {
  try {
    const ollamaStatus = await ollamaService.getStatus();
    const weaviateStatus = await weaviateService.getStatus();
    
    res.json({
      ollama: ollamaStatus,
      weaviate: weaviateStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

app.listen(PORT, () => {
  console.log(`Home Network AI server running on port ${PORT}`);
  console.log(`Ollama URL: ${process.env.OLLAMA_BASE_URL}`);
  console.log(`Weaviate URL: ${process.env.WEAVIATE_URL}`);
});