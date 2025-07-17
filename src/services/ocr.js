const { ComputerVisionClient } = require('@azure/cognitiveservices-computervision');
const { ApiKeyCredentials } = require('@azure/ms-rest-js');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

class OCRService {
  constructor() {
    this.endpoint = process.env.AZURE_COMPUTER_VISION_ENDPOINT;
    this.key = process.env.AZURE_COMPUTER_VISION_KEY;
    
    if (this.endpoint && this.key) {
      this.client = new ComputerVisionClient(
        new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': this.key } }),
        this.endpoint
      );
    } else {
      console.warn('Azure Computer Vision credentials not configured');
    }
  }

  async extractTextFromPDF(filePath) {
    try {
      console.log(`Extracting text from PDF: ${filePath}`);
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      
      console.log(`PDF parsed successfully. Pages: ${data.numpages}, Text length: ${data.text.length}`);
      
      return {
        text: data.text,
        pages: data.numpages,
        metadata: { 
          ...data.metadata, 
          source: 'pdf-parse',
          charCount: data.text.length 
        }
      };
    } catch (error) {
      console.error('PDF parsing error:', error);
      
      if (this.client) {
        console.log('Falling back to Azure OCR for PDF...');
        return await this.extractTextFromImagePDF(filePath);
      }
      
      console.error('No Azure OCR available, PDF processing failed');
      throw error;
    }
  }

  async extractTextFromImagePDF(filePath) {
    if (!this.client) {
      throw new Error('Azure Computer Vision not configured');
    }

    try {
      const fileStream = fs.createReadStream(filePath);
      const result = await this.client.readInStream(fileStream);
      
      const operationId = result.operationLocation.split('/').pop();
      
      let readResult;
      do {
        await new Promise(resolve => setTimeout(resolve, 1000));
        readResult = await this.client.getReadResult(operationId);
      } while (readResult.status === 'notStarted' || readResult.status === 'running');

      if (readResult.status === 'succeeded') {
        const textResults = readResult.analyzeResult.readResults;
        let extractedText = '';
        
        for (const page of textResults) {
          for (const line of page.lines) {
            extractedText += line.text + '\n';
          }
        }
        
        return {
          text: extractedText,
          pages: textResults.length,
          metadata: { source: 'azure-ocr' }
        };
      }
      
      throw new Error(`OCR failed with status: ${readResult.status}`);
    } catch (error) {
      console.error('Azure OCR error:', error);
      throw error;
    }
  }

  async extractTextFromImage(filePath) {
    if (!this.client) {
      throw new Error('Azure Computer Vision not configured');
    }

    try {
      const fileStream = fs.createReadStream(filePath);
      const result = await this.client.readInStream(fileStream);
      
      const operationId = result.operationLocation.split('/').pop();
      
      let readResult;
      do {
        await new Promise(resolve => setTimeout(resolve, 1000));
        readResult = await this.client.getReadResult(operationId);
      } while (readResult.status === 'notStarted' || readResult.status === 'running');

      if (readResult.status === 'succeeded') {
        const textResults = readResult.analyzeResult.readResults;
        let extractedText = '';
        
        for (const page of textResults) {
          for (const line of page.lines) {
            extractedText += line.text + '\n';
          }
        }
        
        return {
          text: extractedText,
          metadata: { 
            source: 'azure-ocr',
            imageType: path.extname(filePath).toLowerCase()
          }
        };
      }
      
      throw new Error(`OCR failed with status: ${readResult.status}`);
    } catch (error) {
      console.error('Image OCR error:', error);
      throw error;
    }
  }

  async processDocument(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.pdf':
        return await this.extractTextFromPDF(filePath);
      case '.jpg':
      case '.jpeg':
      case '.png':
      case '.bmp':
      case '.gif':
      case '.tiff':
        return await this.extractTextFromImage(filePath);
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }
}

module.exports = new OCRService();