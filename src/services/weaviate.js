const weaviate = require('weaviate-ts-client');

class WeaviateService {
  constructor() {
    this.client = weaviate.default.client({
      scheme: 'http',
      host: process.env.WEAVIATE_URL ? process.env.WEAVIATE_URL.replace('http://', '') : 'localhost:8080',
    });
    
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await this.createSchema();
      this.initialized = true;
      console.log('Weaviate service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Weaviate:', error);
      throw error;
    }
  }

  async createSchema() {
    const documentSchema = {
      class: 'Document',
      description: 'A document with text content',
      vectorizer: 'none',
      properties: [
        {
          name: 'title',
          dataType: ['string'],
          description: 'The title of the document',
        },
        {
          name: 'content',
          dataType: ['text'],
          description: 'The content of the document',
        },
        {
          name: 'filePath',
          dataType: ['string'],
          description: 'The file path of the document',
        },
        {
          name: 'fileType',
          dataType: ['string'],
          description: 'The type of the file',
        },
        {
          name: 'metadata',
          dataType: ['string'],
          description: 'Additional metadata about the document (JSON string)',
        },
        {
          name: 'createdAt',
          dataType: ['date'],
          description: 'When the document was created',
        },
      ],
    };

    const imageSchema = {
      class: 'Image',
      description: 'An image with extracted text and metadata',
      vectorizer: 'none',
      properties: [
        {
          name: 'filename',
          dataType: ['string'],
          description: 'The filename of the image',
        },
        {
          name: 'extractedText',
          dataType: ['text'],
          description: 'Text extracted from the image via OCR',
        },
        {
          name: 'filePath',
          dataType: ['string'],
          description: 'The file path of the image',
        },
        {
          name: 'dimensions',
          dataType: ['string'],
          description: 'Image dimensions (width, height) as JSON string',
        },
        {
          name: 'format',
          dataType: ['string'],
          description: 'Image format (jpg, png, etc.)',
        },
        {
          name: 'metadata',
          dataType: ['string'],
          description: 'Additional metadata about the image (JSON string)',
        },
        {
          name: 'createdAt',
          dataType: ['date'],
          description: 'When the image was processed',
        },
      ],
    };

    try {
      const existingClasses = await this.client.schema.getter().do();
      const classNames = existingClasses.classes.map(c => c.class);

      if (!classNames.includes('Document')) {
        await this.client.schema.classCreator().withClass(documentSchema).do();
        console.log('Created Document schema');
      }

      if (!classNames.includes('Image')) {
        await this.client.schema.classCreator().withClass(imageSchema).do();
        console.log('Created Image schema');
      }
    } catch (error) {
      console.error('Error creating schema:', error);
      throw error;
    }
  }

  async addDocument(documentData) {
    await this.initialize();

    try {
      const result = await this.client.data
        .creator()
        .withClassName('Document')
        .withProperties({
          title: documentData.title || 'Untitled',
          content: documentData.content,
          filePath: documentData.filePath,
          fileType: documentData.fileType,
          metadata: JSON.stringify(documentData.metadata || {}),
          createdAt: new Date().toISOString(),
        })
        .do();

      return result;
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  }

  async addImage(imageData) {
    await this.initialize();

    try {
      const result = await this.client.data
        .creator()
        .withClassName('Image')
        .withProperties({
          filename: imageData.filename,
          extractedText: imageData.extractedText || '',
          filePath: imageData.filePath,
          dimensions: JSON.stringify(imageData.dimensions || {}),
          format: imageData.format,
          metadata: JSON.stringify(imageData.metadata || {}),
          createdAt: new Date().toISOString(),
        })
        .do();

      return result;
    } catch (error) {
      console.error('Error adding image:', error);
      throw error;
    }
  }

  async search(query, limit = 10) {
    await this.initialize();

    try {
      const documentResults = await this.client.graphql
        .get()
        .withClassName('Document')
        .withFields('title content filePath fileType metadata createdAt')
        .withWhere({
          operator: 'Or',
          operands: [
            {
              path: ['title'],
              operator: 'Like',
              valueString: `*${query}*`
            },
            {
              path: ['content'],
              operator: 'Like',
              valueString: `*${query}*`
            }
          ]
        })
        .withLimit(limit)
        .do();

      const imageResults = await this.client.graphql
        .get()
        .withClassName('Image')
        .withFields('filename extractedText filePath dimensions format metadata createdAt')
        .withWhere({
          operator: 'Or',
          operands: [
            {
              path: ['filename'],
              operator: 'Like',
              valueString: `*${query}*`
            },
            {
              path: ['extractedText'],
              operator: 'Like',
              valueString: `*${query}*`
            }
          ]
        })
        .withLimit(limit)
        .do();

      return {
        documents: documentResults.data.Get.Document || [],
        images: imageResults.data.Get.Image || [],
      };
    } catch (error) {
      console.error('Error searching:', error);
      throw error;
    }
  }

  async searchDocuments(query, limit = 10) {
    await this.initialize();

    try {
      const results = await this.client.graphql
        .get()
        .withClassName('Document')
        .withFields('title content filePath fileType metadata createdAt')
        .withWhere({
          operator: 'Or',
          operands: [
            {
              path: ['title'],
              operator: 'Like',
              valueString: `*${query}*`
            },
            {
              path: ['content'],
              operator: 'Like',
              valueString: `*${query}*`
            }
          ]
        })
        .withLimit(limit)
        .do();

      return results.data.Get.Document || [];
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  async searchImages(query, limit = 10) {
    await this.initialize();

    try {
      const results = await this.client.graphql
        .get()
        .withClassName('Image')
        .withFields('filename extractedText filePath dimensions format metadata createdAt')
        .withWhere({
          operator: 'Or',
          operands: [
            {
              path: ['filename'],
              operator: 'Like',
              valueString: `*${query}*`
            },
            {
              path: ['extractedText'],
              operator: 'Like',
              valueString: `*${query}*`
            }
          ]
        })
        .withLimit(limit)
        .do();

      return results.data.Get.Image || [];
    } catch (error) {
      console.error('Error searching images:', error);
      throw error;
    }
  }

  async getStatus() {
    try {
      const result = await this.client.misc.metaGetter().do();
      return {
        status: 'healthy',
        version: result.version,
        modules: result.modules
      };
    } catch (error) {
      console.error('Weaviate status check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  async deleteDocument(id) {
    await this.initialize();

    try {
      await this.client.data
        .deleter()
        .withClassName('Document')
        .withId(id)
        .do();

      return { success: true };
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  async deleteImage(id) {
    await this.initialize();

    try {
      await this.client.data
        .deleter()
        .withClassName('Image')
        .withId(id)
        .do();

      return { success: true };
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  async getAllDocuments(limit = 100) {
    await this.initialize();

    try {
      const results = await this.client.graphql
        .get()
        .withClassName('Document')
        .withFields('title content filePath fileType metadata createdAt')
        .withLimit(limit)
        .do();

      return results.data.Get.Document || [];
    } catch (error) {
      console.error('Error getting all documents:', error);
      throw error;
    }
  }

  async getAllImages(limit = 100) {
    await this.initialize();

    try {
      const results = await this.client.graphql
        .get()
        .withClassName('Image')
        .withFields('filename extractedText filePath dimensions format metadata createdAt')
        .withLimit(limit)
        .do();

      return results.data.Get.Image || [];
    } catch (error) {
      console.error('Error getting all images:', error);
      throw error;
    }
  }
}

module.exports = new WeaviateService();