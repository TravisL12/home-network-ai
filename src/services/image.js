const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const sharp = require('sharp');
const plist = require('plist');
const ocrService = require('./ocr');

class ImageService {
  constructor() {
    this.supportedFormats = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff', '.webp'];
    this.iPhotoLibraryPath = path.join(process.env.HOME, 'Pictures');
  }

  async scanImages() {
    const results = {
      directoryScans: [],
      iPhotoScan: null,
      totalImages: 0,
      processedImages: 0,
      errors: []
    };

    try {
      const directoryResults = await this.scanDirectories();
      results.directoryScans = directoryResults.scans;
      results.totalImages += directoryResults.totalImages;
      results.processedImages += directoryResults.processedImages;
      results.errors = results.errors.concat(directoryResults.errors);

      const iPhotoResults = await this.scanIPhotoLibrary();
      results.iPhotoScan = iPhotoResults;
      results.totalImages += iPhotoResults.totalImages;
      results.processedImages += iPhotoResults.processedImages;
      results.errors = results.errors.concat(iPhotoResults.errors);

      return results;
    } catch (error) {
      console.error('Image scanning error:', error);
      results.errors.push(error.message);
      return results;
    }
  }

  async scanDirectories() {
    const imageDirs = [
      '/app/images',
      '/app/pictures',
      '/app/documents'
    ];

    const results = {
      scans: [],
      totalImages: 0,
      processedImages: 0,
      errors: []
    };

    for (const dir of imageDirs) {
      try {
        if (await fs.pathExists(dir)) {
          const scanResult = await this.scanDirectory(dir);
          results.scans.push(scanResult);
          results.totalImages += scanResult.totalImages;
          results.processedImages += scanResult.processedImages;
          results.errors = results.errors.concat(scanResult.errors);
        }
      } catch (error) {
        console.error(`Error scanning directory ${dir}:`, error);
        results.errors.push(`Directory ${dir}: ${error.message}`);
      }
    }

    return results;
  }

  async scanDirectory(dirPath) {
    const result = {
      directory: dirPath,
      totalImages: 0,
      processedImages: 0,
      images: [],
      errors: []
    };

    try {
      const pattern = path.join(dirPath, '**/*');
      const files = glob.sync(pattern);

      const imageFiles = files.filter(file => 
        this.supportedFormats.includes(path.extname(file).toLowerCase())
      );

      result.totalImages = imageFiles.length;

      for (const imagePath of imageFiles) {
        try {
          const imageInfo = await this.processImage(imagePath);
          result.images.push(imageInfo);
          result.processedImages++;
        } catch (error) {
          console.error(`Error processing image ${imagePath}:`, error);
          result.errors.push(`${imagePath}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
      result.errors.push(error.message);
    }

    return result;
  }

  async scanIPhotoLibrary() {
    const result = {
      libraryPath: this.iPhotoLibraryPath,
      totalImages: 0,
      processedImages: 0,
      albums: [],
      errors: []
    };

    try {
      const iPhotoLibraryDir = path.join(this.iPhotoLibraryPath, 'iPhoto Library');
      const photosLibraryDir = path.join(this.iPhotoLibraryPath, 'Photos Library.photoslibrary');

      if (await fs.pathExists(iPhotoLibraryDir)) {
        const iPhotoResult = await this.scanIPhotoLibraryDir(iPhotoLibraryDir);
        result.totalImages += iPhotoResult.totalImages;
        result.processedImages += iPhotoResult.processedImages;
        result.albums = result.albums.concat(iPhotoResult.albums);
        result.errors = result.errors.concat(iPhotoResult.errors);
      }

      if (await fs.pathExists(photosLibraryDir)) {
        const photosResult = await this.scanPhotosLibraryDir(photosLibraryDir);
        result.totalImages += photosResult.totalImages;
        result.processedImages += photosResult.processedImages;
        result.albums = result.albums.concat(photosResult.albums);
        result.errors = result.errors.concat(photosResult.errors);
      }

      const picturesResult = await this.scanDirectory(this.iPhotoLibraryPath);
      result.totalImages += picturesResult.totalImages;
      result.processedImages += picturesResult.processedImages;
      result.albums.push({
        name: 'Pictures Directory',
        images: picturesResult.images
      });
      result.errors = result.errors.concat(picturesResult.errors);

    } catch (error) {
      console.error('Error scanning iPhoto library:', error);
      result.errors.push(error.message);
    }

    return result;
  }

  async scanIPhotoLibraryDir(libraryPath) {
    const result = {
      totalImages: 0,
      processedImages: 0,
      albums: [],
      errors: []
    };

    try {
      const albumDataPath = path.join(libraryPath, 'AlbumData.xml');
      
      if (await fs.pathExists(albumDataPath)) {
        const albumData = await fs.readFile(albumDataPath, 'utf8');
        const parsedData = plist.parse(albumData);
        
        if (parsedData && parsedData.List) {
          for (const album of parsedData.List) {
            const albumResult = await this.processIPhotoAlbum(album, libraryPath);
            result.albums.push(albumResult);
            result.totalImages += albumResult.totalImages;
            result.processedImages += albumResult.processedImages;
            result.errors = result.errors.concat(albumResult.errors);
          }
        }
      }

      const mastersPath = path.join(libraryPath, 'Masters');
      if (await fs.pathExists(mastersPath)) {
        const mastersResult = await this.scanDirectory(mastersPath);
        result.albums.push({
          name: 'Masters',
          totalImages: mastersResult.totalImages,
          processedImages: mastersResult.processedImages,
          images: mastersResult.images
        });
        result.totalImages += mastersResult.totalImages;
        result.processedImages += mastersResult.processedImages;
        result.errors = result.errors.concat(mastersResult.errors);
      }

    } catch (error) {
      console.error('Error scanning iPhoto library directory:', error);
      result.errors.push(error.message);
    }

    return result;
  }

  async scanPhotosLibraryDir(libraryPath) {
    const result = {
      totalImages: 0,
      processedImages: 0,
      albums: [],
      errors: []
    };

    try {
      const originalsPath = path.join(libraryPath, 'originals');
      
      if (await fs.pathExists(originalsPath)) {
        const originalsResult = await this.scanDirectory(originalsPath);
        result.albums.push({
          name: 'Photos Library Originals',
          totalImages: originalsResult.totalImages,
          processedImages: originalsResult.processedImages,
          images: originalsResult.images
        });
        result.totalImages += originalsResult.totalImages;
        result.processedImages += originalsResult.processedImages;
        result.errors = result.errors.concat(originalsResult.errors);
      }

    } catch (error) {
      console.error('Error scanning Photos library directory:', error);
      result.errors.push(error.message);
    }

    return result;
  }

  async processIPhotoAlbum(album, libraryPath) {
    const result = {
      name: album.AlbumName || 'Unknown Album',
      totalImages: 0,
      processedImages: 0,
      images: [],
      errors: []
    };

    try {
      if (album.KeyList) {
        result.totalImages = album.KeyList.length;
        
        for (const key of album.KeyList) {
          try {
            const imagePath = path.join(libraryPath, 'Masters', key);
            
            if (await fs.pathExists(imagePath)) {
              const imageInfo = await this.processImage(imagePath);
              result.images.push(imageInfo);
              result.processedImages++;
            }
          } catch (error) {
            console.error(`Error processing album image ${key}:`, error);
            result.errors.push(`${key}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.error(`Error processing album ${result.name}:`, error);
      result.errors.push(error.message);
    }

    return result;
  }

  async processImage(imagePath) {
    const imageInfo = {
      path: imagePath,
      filename: path.basename(imagePath),
      size: 0,
      dimensions: null,
      format: null,
      extractedText: null,
      metadata: {},
      error: null
    };

    try {
      const stats = await fs.stat(imagePath);
      imageInfo.size = stats.size;
      imageInfo.metadata.created = stats.birthtime;
      imageInfo.metadata.modified = stats.mtime;

      const imageMetadata = await sharp(imagePath).metadata();
      imageInfo.dimensions = {
        width: imageMetadata.width,
        height: imageMetadata.height
      };
      imageInfo.format = imageMetadata.format;

      try {
        const ocrResult = await ocrService.extractTextFromImage(imagePath);
        imageInfo.extractedText = ocrResult.text;
        imageInfo.metadata.ocr = ocrResult.metadata;
      } catch (ocrError) {
        console.warn(`OCR failed for ${imagePath}:`, ocrError.message);
        imageInfo.metadata.ocrError = ocrError.message;
      }

    } catch (error) {
      console.error(`Error processing image ${imagePath}:`, error);
      imageInfo.error = error.message;
    }

    return imageInfo;
  }
}

module.exports = new ImageService();