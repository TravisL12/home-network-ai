import axios from "axios";

const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "http://localhost:3000"
    : "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const chatService = {
  sendMessage: async (message, model = null) => {
    try {
      const payload = { message };
      if (model) {
        payload.model = model;
      }
      const response = await api.post("/api/chat", payload);
      return response.data;
    } catch (error) {
      console.error("Chat API error:", error);
      throw error;
    }
  },
};

export const documentService = {
  ingestDocument: async (documentData) => {
    try {
      const response = await api.post("/api/ingest/document", documentData);
      return response.data;
    } catch (error) {
      console.error("Document ingestion error:", error);
      throw error;
    }
  },

  uploadFiles: async (files) => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await api.post("/api/upload/files", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("File upload error:", error);
      throw error;
    }
  },

  scanImages: async () => {
    try {
      const response = await api.post("/api/scan/images");
      return response.data;
    } catch (error) {
      console.error("Image scanning error:", error);
      throw error;
    }
  },
};

export const statusService = {
  getStatus: async () => {
    try {
      const response = await api.get("/api/status");
      return response.data;
    } catch (error) {
      console.error("Status API error:", error);
      throw error;
    }
  },
};

export const modelService = {
  getModels: async () => {
    try {
      const response = await api.get("/api/models");
      return response.data;
    } catch (error) {
      console.error("Models API error:", error);
      throw error;
    }
  },

  pullModel: async (modelName) => {
    try {
      const response = await api.post("/api/models/pull", { modelName });
      return response.data;
    } catch (error) {
      console.error("Model pull error:", error);
      throw error;
    }
  },
};

export default api;
