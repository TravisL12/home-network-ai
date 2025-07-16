# Home Network AI

A comprehensive AI system for training on local documents using Ollama, Weaviate vector database, and Azure Computer Vision for OCR processing.

## Features

- **Document Processing**: Supports PDF, TXT, MD, and image files
- **OCR Integration**: Azure Computer Vision for text extraction from images and PDFs
- **Vector Search**: Weaviate for semantic search across your document collection
- **Image Scanning**: Automatic scanning of directories and iPhoto library
- **Custom Training**: Create custom Ollama models trained on your documents
- **React Frontend**: Modern web interface with chat, document management, and system monitoring
- **AI Chat Interface**: Interactive chat with your documents using multiple AI models
- **Docker Deployment**: Easy deployment with docker-compose

## Prerequisites

- Docker and Docker Compose
- Azure Computer Vision API key (required for OCR)
- Node.js 18+ (for development)

## 🔑 API Keys & Configuration

### Azure Computer Vision (Required for OCR)
- **Purpose**: OCR text extraction from PDFs and images
- **Cost**: ~$1-2 per 1,000 operations (very affordable)
- **Free Tier**: 5,000 transactions/month available

#### Setup Azure Computer Vision:

1. **Create Azure Computer Vision Resource:**
   - Go to [Azure Portal](https://portal.azure.com)
   - Create "Computer Vision" resource
   - Choose pricing tier:
     - **F0 (Free)**: 5,000 transactions/month
     - **S1 (Standard)**: $1/1,000 transactions

2. **Get Your Keys:**
   - Navigate to your Computer Vision resource
   - Go to "Keys and Endpoint"
   - Copy `Key 1` and `Endpoint`

#### Alternative: Azure CLI Setup
```bash
# Create resource via CLI
az cognitiveservices account create \
  --name "home-ai-vision" \
  --resource-group "your-rg" \
  --kind "ComputerVision" \
  --sku "S1" \
  --location "eastus"

# Get keys
az cognitiveservices account keys list \
  --name "home-ai-vision" \
  --resource-group "your-rg"
```

### 💰 Cost Breakdown
- **Free Tier**: 5,000 transactions/month (sufficient for personal use)
- **Paid Tier**: $1/1,000 transactions
- **Typical Usage**: Processing 1,000 documents = ~$1-2

### 🔧 OCR-Free Mode (Alternative)
The system works **without Azure** for:
- ✅ Plain text files (.txt, .md)
- ✅ Text-based PDFs (native text extraction)
- ❌ Image-based PDFs (needs OCR)
- ❌ Image text extraction (needs OCR)

## Quick Start

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd home-network-ai
   cp .env.example .env
   ```

2. **Configure Environment**
   Edit `.env` file with your Azure Computer Vision credentials:
   ```bash
   # Required for OCR functionality
   AZURE_COMPUTER_VISION_ENDPOINT=https://your-region.cognitiveservices.azure.com/
   AZURE_COMPUTER_VISION_KEY=your-32-character-key-here
   
   # Optional: These have defaults
   OLLAMA_BASE_URL=http://ollama:11434
   WEAVIATE_URL=http://weaviate:8080
   NODE_ENV=production
   PORT=3000
   ```

3. **Start Services**
   ```bash
   docker-compose up -d
   ```

4. **Access the Application**
   - **Web Interface**: http://localhost (React frontend)
   - **API**: http://localhost:3000 (Backend API)
   - **Weaviate**: http://localhost:8080 (Vector database)
   - **Ollama**: http://localhost:11434 (AI models)

## API Endpoints

### Chat
- `POST /api/chat` - Chat with your AI using your document knowledge base
  ```json
  {
    "message": "What did I learn about machine learning?"
  }
  ```

### Document Management
- `POST /api/ingest/document` - Ingest a single document
- `POST /api/upload/files` - Upload multiple files for processing
- `POST /api/scan/images` - Scan and process all images
- `GET /api/status` - Check service status

### Model Management
- Available through Ollama service at port 11434

## Web Interface

The React frontend provides a modern web interface with the following pages:

### 🗨️ Chat Interface
- Interactive chat with your AI assistant
- Real-time responses using your document knowledge base
- Support for multiple AI models (Llama 3.2, Gemma2)
- Markdown rendering with syntax highlighting
- Message history with timestamps and token counts

### 📄 Document Manager
- Drag & drop file upload
- Support for PDF, TXT, MD, and image files
- Automatic OCR processing for images and PDFs
- Batch processing with progress indicators
- Local directory and iPhoto library scanning

### 📊 Status Dashboard
- Real-time system health monitoring
- AI model availability and status
- Database connection health
- Service uptime and performance metrics

## Directory Structure

```
home-network-ai/
├── src/                      # Backend Node.js application
│   ├── services/
│   │   ├── ollama.js          # Ollama integration and training
│   │   ├── weaviate.js        # Vector database operations
│   │   ├── ocr.js             # Azure Computer Vision OCR
│   │   ├── image.js           # Image scanning and processing
│   │   └── document.js        # Document ingestion pipeline
│   └── index.js               # Main Express server
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.js      # Chat UI component
│   │   │   ├── DocumentManager.js    # Document upload UI
│   │   │   └── StatusDashboard.js    # System status UI
│   │   ├── services/
│   │   │   └── api.js         # API client for backend
│   │   └── App.js             # Main React app
│   ├── Dockerfile            # Frontend Docker build
│   └── package.json          # Frontend dependencies
├── documents/                # Place your documents here
├── images/                   # Place your images here
├── docker-compose.yml        # Multi-service orchestration
├── Dockerfile               # Backend Docker build
└── package.json             # Backend dependencies
```

## Usage

### Adding Documents

1. **Web Interface**: Use the Document Manager page to drag & drop files
2. **Manual Upload**: Place documents in the `documents/` directory
3. **API Upload**: Use the `/api/ingest/document` or `/api/upload/files` endpoints
4. **Automatic Scanning**: Use the "Start Scan" button to process local directories

### Training Custom Models

The system can create custom Ollama models trained on your documents:

```javascript
// Example: Create a specialized model
const ollamaService = require('./src/services/ollama');

await ollamaService.createCustomModel(
  'personal-assistant',
  'llama2',
  'You are my personal assistant with access to my documents.',
  documentContext
);
```

### Searching Your Knowledge Base

The system provides semantic search across all your documents and images:

```javascript
// Search for relevant content
const weaviateService = require('./src/services/weaviate');
const results = await weaviateService.search('machine learning notes');
```

## Image Processing

The system automatically processes:
- Files in `images/` directory
- Files in `documents/` directory
- Your iPhoto library (read-only)
- Photos Library (read-only)

Text is extracted from images using Azure Computer Vision OCR and indexed for search.

## Development

### Local Development

```bash
npm install
npm run dev
```

### Testing

```bash
npm test
```

### Adding New Features

1. Create new service in `src/services/`
2. Update `src/index.js` to include new endpoints
3. Update docker-compose.yml if needed

## Configuration

### Environment Variables

- `AZURE_COMPUTER_VISION_ENDPOINT`: Azure Computer Vision endpoint
- `AZURE_COMPUTER_VISION_KEY`: Azure Computer Vision API key
- `OLLAMA_BASE_URL`: Ollama service URL (default: http://ollama:11434)
- `WEAVIATE_URL`: Weaviate service URL (default: http://weaviate:8080)
- `NODE_ENV`: Environment (development/production)
- `PORT`: Application port (default: 3000)

### Supported File Types

**Documents:**
- PDF (.pdf)
- Text (.txt)
- Markdown (.md)
- Word (.doc, .docx)

**Images:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- BMP (.bmp)
- GIF (.gif)
- TIFF (.tiff)
- WebP (.webp)

## Troubleshooting

### Common Issues

1. **Azure OCR Not Working**: Verify your Azure Computer Vision credentials
2. **Ollama Models Not Loading**: Check if Ollama service is running
3. **Weaviate Connection Issues**: Ensure Weaviate service is healthy
4. **Permission Issues**: Check file permissions for mounted volumes

### Logs

```bash
# View application logs
docker-compose logs home-ai-app

# View all service logs
docker-compose logs
```

## Security

- Azure Computer Vision credentials are stored in environment variables
- The system runs in isolated Docker containers
- No external network access required after initial setup
- All data processing happens locally

## License

MIT License - see LICENSE file for details
