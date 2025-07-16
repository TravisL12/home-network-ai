const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const ollamaService = require('./services/ollama');
const weaviateService = require('./services/weaviate');
const ocrService = require('./services/ocr');
const imageService = require('./services/image');
const documentService = require('./services/document');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'Home Network AI is running!' });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    const searchResults = await weaviateService.search(message);
    const response = await ollamaService.generateResponse(message, searchResults);
    
    res.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
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