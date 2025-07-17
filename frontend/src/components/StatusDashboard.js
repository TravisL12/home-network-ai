import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
  Button,
  Pagination,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  SmartToy as BotIcon,
  Storage as StorageIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  Speed as SpeedIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { statusService } from "../services/api";

const StatusDashboard = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showAllDocuments, setShowAllDocuments] = useState(false);
  const [documentPage, setDocumentPage] = useState(1);
  const [documentSearch, setDocumentSearch] = useState("");
  const documentsPerPage = 10;

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await statusService.getStatus();
      setStatus(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Status fetch error:", err);
      setError("Failed to fetch system status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (serviceStatus) => {
    if (serviceStatus === "healthy") return "success";
    if (serviceStatus === "unhealthy") return "error";
    return "warning";
  };

  const getStatusIcon = (serviceStatus) => {
    if (serviceStatus === "healthy") return <CheckCircleIcon color="success" />;
    if (serviceStatus === "unhealthy") return <ErrorIcon color="error" />;
    return <WarningIcon color="warning" />;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading && !status) {
    return (
      <Box sx={{ p: 2 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Loading system status...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">System Status</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {lastUpdated && (
            <Typography variant="body2" color="text.secondary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
          <Tooltip title="Refresh Status">
            <IconButton onClick={fetchStatus} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {status && (
        <Grid container spacing={3}>
          {/* Service Status Cards */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <BotIcon />
                  <Typography variant="h6">Ollama AI</Typography>
                </Box>

                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  {getStatusIcon(status.ollama?.status)}
                  <Chip
                    label={status.ollama?.status || "Unknown"}
                    color={getStatusColor(status.ollama?.status)}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary">
                  Base URL: {status.ollama?.baseUrl}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Models: {status.ollama?.models?.length || 0}
                </Typography>

                {status.ollama?.models?.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {status.ollama.models.slice(0, 3).map((model, index) => (
                      <Chip
                        key={index}
                        label={model.name}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                    {status.ollama.models.length > 3 && (
                      <Chip
                        label={`+${status.ollama.models.length - 3} more`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <StorageIcon />
                  <Typography variant="h6">Weaviate DB</Typography>
                </Box>

                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  {getStatusIcon(status.weaviate?.status)}
                  <Chip
                    label={status.weaviate?.status || "Unknown"}
                    color={getStatusColor(status.weaviate?.status)}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary">
                  Version: {status.weaviate?.version || "Unknown"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Modules: {Object.keys(status.weaviate?.modules || {}).length}
                </Typography>

                {status.weaviate?.modules &&
                  Object.keys(status.weaviate.modules).length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {Object.keys(status.weaviate.modules).map(
                        (module, index) => (
                          <Chip
                            key={index}
                            label={module}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        )
                      )}
                    </Box>
                  )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <SpeedIcon />
                  <Typography variant="h6">System Health</Typography>
                </Box>

                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  {getStatusIcon(
                    status.ollama?.status === "healthy" &&
                      status.weaviate?.status === "healthy"
                      ? "healthy"
                      : "unhealthy"
                  )}
                  <Chip
                    label={
                      status.ollama?.status === "healthy" &&
                      status.weaviate?.status === "healthy"
                        ? "All Systems Operational"
                        : "Service Issues"
                    }
                    color={
                      status.ollama?.status === "healthy" &&
                      status.weaviate?.status === "healthy"
                        ? "success"
                        : "error"
                    }
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary">
                  Last Check: {formatTimestamp(status.timestamp)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* System Information */}
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                System Information
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <BotIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="AI Service"
                        secondary={
                          status.ollama?.status === "healthy"
                            ? "Ready for queries"
                            : "Service unavailable"
                        }
                      />
                    </ListItem>

                    <ListItem>
                      <ListItemIcon>
                        <StorageIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Vector Database"
                        secondary={
                          status.weaviate?.status === "healthy"
                            ? "Ready for document search"
                            : "Database unavailable"
                        }
                      />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <DocumentIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Document Processing"
                        secondary="PDF, TXT, MD files supported"
                      />
                    </ListItem>

                    <ListItem>
                      <ListItemIcon>
                        <ImageIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Image Processing"
                        secondary="OCR text extraction enabled"
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Document Status */}
          {status.documents && (
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Knowledge Base Status
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <DocumentIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Total Documents"
                          secondary={`${
                            status.documents.total || 0
                          } documents indexed`}
                        />
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <ImageIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Images with OCR"
                          secondary={`${
                            status.documents.images || 0
                          } images processed`}
                        />
                      </ListItem>
                    </List>
                  </Grid>

                  <Grid item xs={12}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Typography variant="subtitle2">
                        {showAllDocuments
                          ? "All Documents:"
                          : "Recent Documents:"}
                      </Typography>
                      {status.documents.allDocuments &&
                        status.documents.allDocuments.length > 5 && (
                          <Button
                            size="small"
                            onClick={() =>
                              setShowAllDocuments(!showAllDocuments)
                            }
                            endIcon={
                              showAllDocuments ? (
                                <ExpandLessIcon />
                              ) : (
                                <ExpandMoreIcon />
                              )
                            }
                          >
                            {showAllDocuments
                              ? "Show Less"
                              : `Show All (${status.documents.allDocuments.length})`}
                          </Button>
                        )}
                    </Box>

                    {showAllDocuments &&
                      status.documents.allDocuments &&
                      status.documents.allDocuments.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <TextField
                            size="small"
                            placeholder="Search documents..."
                            value={documentSearch}
                            onChange={(e) => {
                              setDocumentSearch(e.target.value);
                              setDocumentPage(1);
                            }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <SearchIcon />
                                </InputAdornment>
                              ),
                            }}
                            fullWidth
                          />
                        </Box>
                      )}

                    {status.documents.recentDocuments &&
                    status.documents.recentDocuments.length > 0 ? (
                      <>
                        <List dense>
                          {showAllDocuments
                            ? (() => {
                                const filteredDocs =
                                  status.documents.allDocuments.filter((doc) =>
                                    doc.title
                                      .toLowerCase()
                                      .includes(documentSearch.toLowerCase())
                                  );
                                const startIndex =
                                  (documentPage - 1) * documentsPerPage;
                                const endIndex = startIndex + documentsPerPage;
                                const paginatedDocs = filteredDocs.slice(
                                  startIndex,
                                  endIndex
                                );
                                const totalPages = Math.ceil(
                                  filteredDocs.length / documentsPerPage
                                );

                                return (
                                  <>
                                    {paginatedDocs.map((doc, index) => (
                                      <ListItem
                                        key={doc.id || index}
                                        sx={{ py: 0.5 }}
                                      >
                                        <ListItemIcon>
                                          <DocumentIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText
                                          primary={doc.title}
                                          secondary={
                                            <Box>
                                              <Typography
                                                variant="caption"
                                                display="block"
                                              >
                                                {doc.fileType} •{" "}
                                                {new Date(
                                                  doc.createdAt
                                                ).toLocaleDateString()}
                                              </Typography>
                                              <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                display="block"
                                              >
                                                {doc.characterCount?.toLocaleString() ||
                                                  0}{" "}
                                                characters
                                              </Typography>
                                              <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                display="block"
                                                sx={{ fontFamily: "monospace" }}
                                              >
                                                {doc.filePath}
                                              </Typography>
                                            </Box>
                                          }
                                          primaryTypographyProps={{
                                            variant: "body2",
                                          }}
                                        />
                                      </ListItem>
                                    ))}
                                    {totalPages > 1 && (
                                      <Box
                                        sx={{
                                          display: "flex",
                                          justifyContent: "center",
                                          mt: 2,
                                        }}
                                      >
                                        <Pagination
                                          count={totalPages}
                                          page={documentPage}
                                          onChange={(event, value) =>
                                            setDocumentPage(value)
                                          }
                                          size="small"
                                        />
                                      </Box>
                                    )}
                                    <Box sx={{ mt: 1 }}>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        Showing {paginatedDocs.length} of{" "}
                                        {filteredDocs.length} documents
                                      </Typography>
                                    </Box>
                                  </>
                                );
                              })()
                            : status.documents.recentDocuments.map(
                                (doc, index) => (
                                  <ListItem key={index} sx={{ py: 0.5 }}>
                                    <ListItemIcon>
                                      <DocumentIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={doc.title}
                                      secondary={
                                        <Box>
                                          <Typography
                                            variant="caption"
                                            display="block"
                                          >
                                            {doc.fileType} •{" "}
                                            {new Date(
                                              doc.createdAt
                                            ).toLocaleDateString()}
                                          </Typography>
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            display="block"
                                          >
                                            {doc.characterCount?.toLocaleString() ||
                                              0}{" "}
                                            characters
                                          </Typography>
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            display="block"
                                            sx={{ fontFamily: "monospace" }}
                                          >
                                            {doc.filePath}
                                          </Typography>
                                        </Box>
                                      }
                                      primaryTypographyProps={{
                                        variant: "body2",
                                      }}
                                    />
                                  </ListItem>
                                )
                              )}
                        </List>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No documents found. Upload documents to start querying
                        them.
                      </Typography>
                    )}
                  </Grid>

                  {/* Images Section */}
                  {status.documents.allImages &&
                    status.documents.allImages.length > 0 && (
                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" gutterBottom>
                          Indexed Images ({status.documents.allImages.length}):
                        </Typography>
                        <List dense>
                          {status.documents.allImages
                            .slice(0, 10)
                            .map((img, index) => (
                              <ListItem key={index} sx={{ py: 0.5 }}>
                                <ListItemIcon>
                                  <ImageIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={img.filename}
                                  secondary={
                                    <Box>
                                      <Typography
                                        variant="caption"
                                        display="block"
                                      >
                                        {img.format} •{" "}
                                        {new Date(
                                          img.createdAt
                                        ).toLocaleDateString()}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        display="block"
                                      >
                                        {img.characterCount?.toLocaleString() ||
                                          0}{" "}
                                        characters extracted
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        display="block"
                                        sx={{ fontFamily: "monospace" }}
                                      >
                                        {img.filePath}
                                      </Typography>
                                    </Box>
                                  }
                                  primaryTypographyProps={{ variant: "body2" }}
                                />
                              </ListItem>
                            ))}
                          {status.documents.allImages.length > 10 && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ ml: 2 }}
                            >
                              ... and {status.documents.allImages.length - 10}{" "}
                              more images
                            </Typography>
                          )}
                        </List>
                      </Grid>
                    )}
                </Grid>

                {status.documents.total > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Alert severity="success" icon={<CheckCircleIcon />}>
                      ✅ Your documents are indexed and ready for AI queries!
                      Try asking about them in the Chat interface.
                    </Alert>
                  </Box>
                )}
              </Paper>
            </Grid>
          )}

          {/* Service Details */}
          {(status.ollama?.error || status.weaviate?.error) && (
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom color="error">
                  Service Errors
                </Typography>

                {status.ollama?.error && (
                  <Alert severity="error" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2">Ollama Error:</Typography>
                    <Typography variant="body2">
                      {status.ollama.error}
                    </Typography>
                  </Alert>
                )}

                {status.weaviate?.error && (
                  <Alert severity="error" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2">Weaviate Error:</Typography>
                    <Typography variant="body2">
                      {status.weaviate.error}
                    </Typography>
                  </Alert>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default StatusDashboard;
