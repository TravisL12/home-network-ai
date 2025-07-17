const fs = require("fs-extra");
const path = require("path");
const glob = require("glob");
const cron = require("node-cron");
const ocrService = require("./ocr");
const weaviateService = require("./weaviate");
const imageService = require("./image");

class DocumentService {
  constructor() {
    this.supportedDocuments = [".pdf", ".txt", ".md", ".doc", ".docx"];
    this.supportedImages = [
      ".jpg",
      ".jpeg",
      ".png",
      ".bmp",
      ".gif",
      ".tiff",
      ".webp",
    ];
    this.watchedDirectories = [
      "/app/documents",
      "/app/images",
      // Development paths
      path.join(process.cwd(), "documents"),
      path.join(process.cwd(), "images"),
    ];
    this.processedFiles = new Set();
    this.isProcessing = false;
  }

  async initialize() {
    console.log("Initializing document service...");

    await this.createDirectories();
    await this.loadProcessedFiles();
    await this.scheduleAutomaticScanning();

    console.log("Document service initialized");
  }

  async createDirectories() {
    for (const dir of this.watchedDirectories) {
      await fs.ensureDir(dir);
      console.log(`Ensured directory exists: ${dir}`);
    }
  }

  async loadProcessedFiles() {
    try {
      const documents = await weaviateService.getAllDocuments();
      const images = await weaviateService.getAllImages();

      documents.forEach((doc) => {
        if (doc.filePath) {
          this.processedFiles.add(doc.filePath);
        }
      });

      images.forEach((img) => {
        if (img.filePath) {
          this.processedFiles.add(img.filePath);
        }
      });

      console.log(
        `Loaded ${this.processedFiles.size} previously processed files`
      );
    } catch (error) {
      console.error("Error loading processed files:", error);
    }
  }

  async scheduleAutomaticScanning() {
    cron.schedule("0 */6 * * *", async () => {
      console.log("Starting scheduled document scan...");
      await this.scanAndIngestAll();
    });

    console.log("Scheduled automatic scanning every 6 hours");
  }

  async scanAndIngestAll() {
    if (this.isProcessing) {
      console.log("Already processing documents, skipping...");
      return;
    }

    this.isProcessing = true;

    try {
      console.log("Starting comprehensive document and image scan...");

      const results = {
        documents: await this.scanDocuments(),
        images: await this.scanImages(),
        startTime: new Date().toISOString(),
        endTime: null,
      };

      results.endTime = new Date().toISOString();

      console.log("Scan completed:", {
        documentsProcessed: results.documents.processed,
        imagesProcessed: results.images.processed,
        duration: new Date(results.endTime) - new Date(results.startTime),
      });

      return results;
    } catch (error) {
      console.error("Error during scan and ingest:", error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  async scanDocuments() {
    const results = {
      scanned: 0,
      processed: 0,
      errors: [],
      newFiles: [],
    };

    for (const directory of this.watchedDirectories) {
      try {
        if (await fs.pathExists(directory)) {
          const files = await this.getFilesInDirectory(
            directory,
            this.supportedDocuments
          );

          for (const filePath of files) {
            results.scanned++;

            try {
              if (!this.processedFiles.has(filePath)) {
                await this.ingestDocument({ filePath });
                results.processed++;
                results.newFiles.push(filePath);
                this.processedFiles.add(filePath);
              }
            } catch (error) {
              console.error(`Error processing document ${filePath}:`, error);
              results.errors.push({
                file: filePath,
                error: error.message,
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error scanning directory ${directory}:`, error);
        results.errors.push({
          directory,
          error: error.message,
        });
      }
    }

    return results;
  }

  async scanImages() {
    const results = {
      scanned: 0,
      processed: 0,
      errors: [],
      newFiles: [],
    };

    try {
      const imageResults = await imageService.scanImages();

      for (const dirScan of imageResults.directoryScans) {
        for (const image of dirScan.images) {
          results.scanned++;

          try {
            if (!this.processedFiles.has(image.path)) {
              await this.ingestImage(image);
              results.processed++;
              results.newFiles.push(image.path);
              this.processedFiles.add(image.path);
            }
          } catch (error) {
            console.error(`Error processing image ${image.path}:`, error);
            results.errors.push({
              file: image.path,
              error: error.message,
            });
          }
        }
      }

      if (imageResults.iPhotoScan) {
        for (const album of imageResults.iPhotoScan.albums) {
          for (const image of album.images) {
            results.scanned++;

            try {
              if (!this.processedFiles.has(image.path)) {
                await this.ingestImage(image);
                results.processed++;
                results.newFiles.push(image.path);
                this.processedFiles.add(image.path);
              }
            } catch (error) {
              console.error(
                `Error processing iPhoto image ${image.path}:`,
                error
              );
              results.errors.push({
                file: image.path,
                error: error.message,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error scanning images:", error);
      results.errors.push({
        error: error.message,
      });
    }

    return results;
  }

  async getFilesInDirectory(directory, extensions) {
    const pattern = path.join(directory, "**/*");
    const files = glob.sync(pattern);

    return files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return extensions.includes(ext) && fs.statSync(file).isFile();
    });
  }

  async ingestDocument(documentData) {
    const { filePath, title, content, fileType } = documentData;

    try {
      let processedContent = content;
      let extractedTitle = title;
      let actualFilePath = filePath;

      // If content is provided, use it directly
      if (content && content.trim().length > 0) {
        processedContent = content;
        extractedTitle = extractedTitle || filePath || "Untitled Document";
        actualFilePath = filePath || "uploaded-content";
      }
      // If only filePath is provided, try to read from filesystem
      else if (filePath && !content) {
        if (!(await fs.pathExists(filePath))) {
          throw new Error(`File not found: ${filePath}`);
        }

        const ext = path.extname(filePath).toLowerCase();
        extractedTitle = extractedTitle || path.basename(filePath, ext);

        if (ext === ".pdf") {
          const ocrResult = await ocrService.extractTextFromPDF(filePath);
          processedContent = ocrResult.text;
        } else if (this.supportedImages.includes(ext)) {
          const ocrResult = await ocrService.extractTextFromImage(filePath);
          processedContent = ocrResult.text;
        } else if ([".txt", ".md"].includes(ext)) {
          processedContent = await fs.readFile(filePath, "utf8");
        } else {
          throw new Error(`Unsupported file type: ${ext}`);
        }
      } else {
        throw new Error("Either content or valid filePath must be provided");
      }

      if (!processedContent || processedContent.trim().length === 0) {
        console.warn(`No content extracted from ${filePath}`);
        return { success: false, reason: "No content extracted" };
      }

      const documentRecord = {
        title: extractedTitle,
        content: processedContent,
        filePath: actualFilePath,
        fileType: fileType || path.extname(actualFilePath || "").toLowerCase(),
        metadata: {
          fileSize:
            actualFilePath && (await fs.pathExists(actualFilePath))
              ? (await fs.stat(actualFilePath)).size
              : processedContent.length,
          processedAt: new Date().toISOString(),
          source: "document-service",
        },
      };

      const result = await weaviateService.addDocument(documentRecord);

      console.log(`Successfully ingested document: ${extractedTitle}`);
      return { success: true, id: result.id, processedContent };
    } catch (error) {
      console.error("Error ingesting document:", error);
      throw error;
    }
  }

  async ingestImage(imageData) {
    try {
      const imageRecord = {
        filename: imageData.filename,
        extractedText: imageData.extractedText || "",
        filePath: imageData.path,
        dimensions: imageData.dimensions,
        format: imageData.format,
        metadata: {
          ...imageData.metadata,
          fileSize: imageData.size || 0,
          processedAt: new Date().toISOString(),
          source: "document-service",
        },
      };

      const result = await weaviateService.addImage(imageRecord);

      console.log(`Successfully ingested image: ${imageData.filename}`);
      return { success: true, id: result.id };
    } catch (error) {
      console.error("Error ingesting image:", error);
      throw error;
    }
  }

  async searchDocuments(query, limit = 10) {
    try {
      const results = await weaviateService.search(query, limit);
      return results;
    } catch (error) {
      console.error("Error searching documents:", error);
      throw error;
    }
  }

  async getStats() {
    try {
      const documents = await weaviateService.getAllDocuments();
      const images = await weaviateService.getAllImages();

      return {
        totalDocuments: documents.length,
        totalImages: images.length,
        processedFiles: this.processedFiles.size,
        isProcessing: this.isProcessing,
        lastScanTime: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error getting stats:", error);
      throw error;
    }
  }
}

module.exports = new DocumentService();
