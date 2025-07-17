#!/bin/bash

# Start backend services with Docker
echo "Starting backend services..."
docker-compose up -d ollama weaviate home-ai-app

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Start frontend in development mode with hot reloading
echo "Starting frontend with hot reloading..."
cd frontend
PORT=3001 npm start