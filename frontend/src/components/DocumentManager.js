import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { documentService } from '../services/api';

const DocumentManager = () => {
  const [uploadStatus, setUploadStatus] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, currentFile: '' });
  const [processingStage, setProcessingStage] = useState('');

  const onDrop = async (acceptedFiles) => {
    setIsUploading(true);
    setUploadStatus(null);
    setUploadProgress({ current: 0, total: acceptedFiles.length, currentFile: '' });

    try {
      // Use the new uploadFiles function for binary files
      const binaryFiles = acceptedFiles.filter(file => {
        const extension = file.name.toLowerCase().split('.').pop();
        return !['txt', 'md'].includes(extension);
      });
      
      // Use the ingestDocument function for text files
      const textFiles = acceptedFiles.filter(file => {
        const extension = file.name.toLowerCase().split('.').pop();
        return ['txt', 'md'].includes(extension);
      });

      const results = [];
      let currentFileIndex = 0;

      // Handle binary files (PDFs, images)
      if (binaryFiles.length > 0) {
        setProcessingStage('Processing binary files (PDFs, images)...');
        
        // Process binary files one by one for better progress tracking
        for (const file of binaryFiles) {
          currentFileIndex++;
          setUploadProgress({ current: currentFileIndex, total: acceptedFiles.length, currentFile: file.name });
          setProcessingStage(`Processing ${file.name}...`);
          
          try {
            const singleFileResult = await documentService.uploadFiles([file]);
            results.push(...singleFileResult.results);
          } catch (error) {
            results.push({
              filename: file.name,
              success: false,
              error: error.message,
            });
          }
        }
      }

      // Handle text files
      for (const file of textFiles) {
        currentFileIndex++;
        setUploadProgress({ current: currentFileIndex, total: acceptedFiles.length, currentFile: file.name });
        setProcessingStage(`Processing ${file.name}...`);
        
        try {
          const content = await file.text();
          const result = await documentService.ingestDocument({
            filePath: file.name,
            title: file.name,
            content: content,
            fileType: '.' + file.name.toLowerCase().split('.').pop(),
          });
          results.push({
            filename: file.name,
            success: true,
            result: result,
          });
        } catch (error) {
          results.push({
            filename: file.name,
            success: false,
            error: error.message,
          });
        }
      }
      
      setProcessingStage('Finalizing document indexing...');
      
      const successCount = results.filter(r => r.success).length;
      
      setUploadStatus({
        type: successCount > 0 ? 'success' : 'error',
        message: `Successfully uploaded ${successCount} of ${results.length} document(s)`,
        details: results,
      });
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        type: 'error',
        message: 'Failed to upload documents. Please try again.',
        error: error.message,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0, currentFile: '' });
      setProcessingStage('');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff', '.webp'],
    },
    multiple: true,
  });

  const handleScanImages = async () => {
    setIsScanning(true);
    setScanStatus(null);
    setScanResults(null);

    try {
      const results = await documentService.scanImages();
      
      setScanResults(results);
      setScanStatus({
        type: 'success',
        message: `Scan completed! Processed ${results.totalImages} images`,
      });
    } catch (error) {
      console.error('Scan error:', error);
      setScanStatus({
        type: 'error',
        message: 'Failed to scan images. Please try again.',
        error: error.message,
      });
    } finally {
      setIsScanning(false);
    }
  };

  const renderScanResults = () => {
    if (!scanResults) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Scan Results
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Directory Scans
                </Typography>
                <Typography variant="h4" component="div">
                  {scanResults.directoryScans?.length || 0}
                </Typography>
                <Typography variant="body2">
                  Directories processed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Images
                </Typography>
                <Typography variant="h4" component="div">
                  {scanResults.totalImages || 0}
                </Typography>
                <Typography variant="body2">
                  Images found and processed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {scanResults.directoryScans && scanResults.directoryScans.length > 0 && (
          <Box sx={{ mt: 2 }}>
            {scanResults.directoryScans.map((scan, index) => (
              <Accordion key={index}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FolderIcon />
                    <Typography>{scan.directory}</Typography>
                    <Chip 
                      label={`${scan.processedImages}/${scan.totalImages}`}
                      size="small"
                      color={scan.processedImages === scan.totalImages ? 'success' : 'warning'}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {scan.images?.slice(0, 10).map((image, imgIndex) => (
                      <ListItem key={imgIndex}>
                        <ListItemIcon>
                          <ImageIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={image.filename}
                          secondary={`${image.format} • ${image.dimensions?.width}x${image.dimensions?.height}`}
                        />
                        {image.extractedText && (
                          <Chip label="OCR" size="small" color="success" />
                        )}
                      </ListItem>
                    ))}
                    {scan.images?.length > 10 && (
                      <ListItem>
                        <ListItemText
                          primary={`... and ${scan.images.length - 10} more images`}
                        />
                      </ListItem>
                    )}
                  </List>
                  
                  {scan.errors && scan.errors.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="error">
                        Errors:
                      </Typography>
                      <List dense>
                        {scan.errors.map((error, errorIndex) => (
                          <ListItem key={errorIndex}>
                            <ListItemIcon>
                              <ErrorIcon color="error" />
                            </ListItemIcon>
                            <ListItemText
                              primary={error.file || error.directory}
                              secondary={error.error}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        {scanResults.iPhotoScan && (
          <Box sx={{ mt: 2 }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ImageIcon />
                  <Typography>iPhoto Library</Typography>
                  <Chip 
                    label={`${scanResults.iPhotoScan.processedImages}/${scanResults.iPhotoScan.totalImages}`}
                    size="small"
                    color={scanResults.iPhotoScan.processedImages === scanResults.iPhotoScan.totalImages ? 'success' : 'warning'}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {scanResults.iPhotoScan.albums?.map((album, albumIndex) => (
                    <ListItem key={albumIndex}>
                      <ListItemIcon>
                        <FolderIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={album.name}
                        secondary={`${album.processedImages}/${album.totalImages} images`}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Document Manager
      </Typography>
      
      <Grid container spacing={3}>
        {/* Upload Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload Documents
            </Typography>
            
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'grey.300',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragActive ? 'action.hover' : 'transparent',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <input {...getInputProps()} />
              <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                or click to select files
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Chip label="PDF" size="small" sx={{ mr: 1 }} />
                <Chip label="TXT" size="small" sx={{ mr: 1 }} />
                <Chip label="MD" size="small" sx={{ mr: 1 }} />
                <Chip label="Images" size="small" />
              </Box>
            </Box>

            {isUploading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress 
                  variant={uploadProgress.total > 0 ? 'determinate' : 'indeterminate'}
                  value={uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0}
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {uploadProgress.total > 0 ? (
                    `Processing ${uploadProgress.current} of ${uploadProgress.total} files`
                  ) : (
                    'Uploading documents...'
                  )}
                </Typography>
                {uploadProgress.currentFile && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Current: {uploadProgress.currentFile}
                  </Typography>
                )}
                {processingStage && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    {processingStage}
                  </Typography>
                )}
              </Box>
            )}

            {uploadStatus && (
              <Alert 
                severity={uploadStatus.type} 
                sx={{ mt: 2 }}
              >
                {uploadStatus.message}
                {uploadStatus.type === 'success' && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      ✅ Documents are now indexed and ready for AI queries!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Go to the Chat interface to ask questions about your documents.
                    </Typography>
                  </Box>
                )}
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Scan Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Scan Local Files
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Automatically scan your local directories and iPhoto library for documents and images.
            </Typography>

            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleScanImages}
              disabled={isScanning}
              fullWidth
              sx={{ mb: 2 }}
            >
              {isScanning ? 'Scanning...' : 'Start Scan'}
            </Button>

            {isScanning && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Scanning directories and processing images...
                </Typography>
              </Box>
            )}

            {scanStatus && (
              <Alert 
                severity={scanStatus.type} 
                sx={{ mt: 2 }}
              >
                {scanStatus.message}
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Scan Results */}
      {renderScanResults()}
    </Box>
  );
};

export default DocumentManager;