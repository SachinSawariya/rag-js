# Simple RAG

A minimal, production-ready Retrieval-Augmented Generation (RAG) application built with TypeScript, Node.js, Express, Ollama, and ChromaDB. This application provides a REST API for asking questions about your documents and uploading Txt for ingestion, using local LLMs and embeddings.

## Overview

This RAG application:
- Provides a REST API server with endpoints for chat queries and Txt file uploads
- Ingests documents (Txt) and generates embeddings using Ollama's `mxbai-embed-large` model
- Stores embeddings in ChromaDB for efficient similarity search
- Answers questions using retrieved context and Ollama's `gemma3` LLM
- Runs entirely locally - no external API calls required
- Supports both API and CLI interfaces




## Prerequisites

### System Requirements

- **Node.js** ≥ 18
- **TypeScript** (installed via npm)
- **Docker** (for ChromaDB)
- **Ollama** installed and running locally

### Install Ollama

Visit [ollama.ai](https://ollama.ai) to install Ollama for your platform.

### Required Models

Ensure you have the following models installed in Ollama:

```bash
# Check installed models
ollama list

# Install required models if missing
ollama pull gemma3
ollama pull mxbai-embed-large
```

## Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd simple-rag
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

   Also do `npm i` inside `FRONTEND` folder

3. **Start ChromaDB** (in a separate terminal):
   ```bash
   docker run -d -p 8000:8000 --name chromadb chromadb/chroma
   ```

   To stop ChromaDB later:
   ```bash
   docker stop chromadb
   docker rm chromadb
   ```

4. **Verify Ollama is running**:
   ```bash
   ollama list
   ```
5. **Run the application**:
  `./start.sh`