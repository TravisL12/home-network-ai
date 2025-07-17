import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  Avatar,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  Clear as ClearIcon,
  ContentCopy as CopyIcon,
} from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { chatService, modelService } from "../services/api";

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    setMessages([
      {
        id: 1,
        type: "bot",
        content:
          "Hello! I'm your Home Network AI assistant. I can help you search through your documents, images, and answer questions based on your personal knowledge base. What would you like to know?",
        timestamp: new Date(),
      },
    ]);

    // Fetch available models
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await modelService.getModels();
      setModels(response.models || []);
      if (response.models && response.models.length > 0) {
        setSelectedModel(response.models[0].name);
      }
    } catch (error) {
      console.error("Failed to fetch models:", error);
    }
  };

  const handleModelChange = (event) => {
    setSelectedModel(event.target.value);
  };

  const handlePullModel = async (modelName) => {
    setIsDownloading(true);
    try {
      await modelService.pullModel(modelName);
      await fetchModels(); // Refresh models list
      setSelectedModel(modelName);
    } catch (error) {
      console.error("Failed to pull model:", error);
      setError(`Failed to download model: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatService.sendMessage(
        inputMessage,
        selectedModel
      );

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content:
          response.response?.response ||
          response.response ||
          "I received your message but couldn't generate a response.",
        timestamp: new Date(),
        metadata: response.response?.metadata || response.metadata,
        model: selectedModel,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setError(
        "Failed to get response. Please check if the AI service is running."
      );

      const errorMessage = {
        id: Date.now() + 1,
        type: "bot",
        content:
          "Sorry, I encountered an error. Please make sure the AI service is running and try again.",
        timestamp: new Date(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 1,
        type: "bot",
        content: "Chat cleared! How can I help you today?",
        timestamp: new Date(),
      },
    ]);
    setError(null);
  };

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content);
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" component="h2">
            AI Chat Assistant
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={handleClearChat}
            size="small"
          >
            Clear Chat
          </Button>
        </Box>

        {/* Model Selection */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>AI Model</InputLabel>
            <Select
              value={selectedModel}
              label="AI Model"
              onChange={handleModelChange}
              disabled={isDownloading}
            >
              {models.map((model) => (
                <MenuItem key={model.name} value={model.name}>
                  {model.name} ({(model.size / 1e9).toFixed(1)}GB)
                </MenuItem>
              ))}
              <MenuItem value="custom">
                <em>Download New Model...</em>
              </MenuItem>
            </Select>
          </FormControl>

          {isDownloading && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Downloading model...
              </Typography>
            </Box>
          )}

          {selectedModel === "custom" && (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                variant="contained"
                onClick={() => handlePullModel("llama3.2:3b")}
                disabled={isDownloading}
              >
                Download Llama 3.2 3B
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={() => handlePullModel("qwen2.5:7b")}
                disabled={isDownloading}
              >
                Download Qwen 2.5 7B
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Messages */}
      <Paper
        elevation={1}
        sx={{
          flexGrow: 1,
          overflow: "auto",
          p: 1,
          mb: 2,
          backgroundColor: "#fafafa",
        }}
      >
        <List>
          {messages.map((message) => (
            <ListItem
              key={message.id}
              sx={{
                display: "flex",
                flexDirection: message.type === "user" ? "row-reverse" : "row",
                alignItems: "flex-start",
                mb: 1,
              }}
            >
              <Avatar
                sx={{
                  bgcolor:
                    message.type === "user" ? "primary.main" : "secondary.main",
                  mx: 1,
                }}
              >
                {message.type === "user" ? <PersonIcon /> : <BotIcon />}
              </Avatar>

              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  maxWidth: "70%",
                  bgcolor: message.type === "user" ? "primary.light" : "white",
                  color:
                    message.type === "user"
                      ? "primary.contrastText"
                      : "text.primary",
                  borderRadius: 2,
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box sx={{ flexGrow: 1 }}>
                    {message.type === "bot" ? (
                      <ReactMarkdown
                        components={{
                          code({
                            node,
                            inline,
                            className,
                            children,
                            ...props
                          }) {
                            const match = /language-(\w+)/.exec(
                              className || ""
                            );
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={tomorrow}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, "")}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      <Typography variant="body1">{message.content}</Typography>
                    )}
                  </Box>

                  <IconButton
                    size="small"
                    onClick={() => handleCopyMessage(message.content)}
                    sx={{ ml: 1, opacity: 0.7 }}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 1,
                  }}
                >
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    {formatTimestamp(message.timestamp)}
                  </Typography>

                  {message.metadata && (
                    <Chip
                      label={`${message.metadata.eval_count || 0} tokens`}
                      size="small"
                      variant="outlined"
                      sx={{ opacity: 0.7 }}
                    />
                  )}
                </Box>
              </Paper>
            </ListItem>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <ListItem sx={{ display: "flex", justifyContent: "flex-start" }}>
              <Avatar sx={{ bgcolor: "secondary.main", mx: 1 }}>
                <BotIcon />
              </Avatar>
              <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2">Thinking...</Typography>
                </Box>
              </Paper>
            </ListItem>
          )}

          <div ref={messagesEndRef} />
        </List>
      </Paper>

      {/* Input */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Ask me anything about your documents..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            variant="outlined"
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            sx={{ minWidth: "auto", px: 2 }}
          >
            <SendIcon />
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatInterface;
