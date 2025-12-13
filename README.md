# Simple RAG CLI

A minimal, production-ready Retrieval-Augmented Generation (RAG) application built with TypeScript, Node.js, Ollama, and ChromaDB. This CLI tool allows you to ask questions about your documents using local LLMs and embeddings.

## Overview

This RAG application:
- Ingests documents and generates embeddings using Ollama's `mxbai-embed-large` model
- Stores embeddings in ChromaDB for efficient similarity search
- Answers questions using retrieved context and Ollama's `gemma3` LLM
- Runs entirely locally - no external API calls required

## Architecture

```mermaid
flowchart TD
    User["User CLI Input"] --> CLI["CLI.ts"]
    CLI --> QueryService["QueryService.ts"]
    QueryService --> OllamaService["OllamaService.ts"]
    QueryService --> ChromaService["ChromaService.ts"]
    OllamaService --> EmbedAPI["Ollama Embeddings API"]
    OllamaService --> GenAPI["Ollama Generate API"]
    ChromaService --> ChromaDB[("ChromaDB")]
    
    IngestionService["IngestionService.ts"] --> OllamaService
    IngestionService --> ChromaService
    IngestionService --> FileSystem["YouTube.txt"]
    
    Config["Config.ts"] --> CLI
    Config --> QueryService
    Config --> IngestionService
    
    Main["index.ts"] --> CLI
    Main --> Config
```

**Alternative Text Diagram** (for markdown previewers without Mermaid support):

```
┌─────────────┐
│ User Input  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  index.ts   │◄────┐
└──────┬──────┘     │
       │            │
       ▼            │
┌─────────────┐     │
│   CLI.ts    │     │
└──────┬──────┘     │
       │            │
       ▼            │
┌─────────────┐     │
│QueryService │     │
└──┬──────┬───┘     │
   │      │         │
   │      │         │
   ▼      ▼         │
┌────-─┐ ┌-─────┐   │
│Ollama│ │Chroma│   │
│Service│Service│   │
└──┬─--┘ └─-─┬──┘   │
   │         │      │
   │         ▼      │
   │   ┌─────────┐  │
   │   │ChromaDB │  │
   │   └─────────┘  │
   │                │
   ▼                │
┌──────────────┐    │
│Ollama APIs   │    │
│(Embed/Gen)   │    │
└──────────────┘    │
                    │
┌─────────────┐     │
│Ingestion    │     │
│Service.ts   │─────┘
└──┬──────┬───┘
   │      │
   ▼      ▼
┌─────-┐ ┌─────-┐
│Ollama│ │Chroma│
│Service│Service│
└─────-┘ └─────-┘
   │
   ▼
┌──────────────┐
│  YouTube.txt │
└──────────────┘
```

### Data Flow

1. **Ingestion Phase**:
   - Documents are loaded from `data/YouTube.txt`
   - Text is chunked into overlapping segments (1000 chars with 200 char overlap)
   - Each chunk is embedded using `mxbai-embed-large`
   - Embeddings are stored in ChromaDB with document text

2. **Query Phase**:
   - User question is embedded using the same model
   - Similarity search retrieves top 3 most relevant chunks
   - Retrieved context is combined with the question
   - `gemma3` generates an answer based on the context

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

## Configuration

Configuration is managed in `src/utils/Config.ts` as a TypeScript class. The configuration interfaces are defined in `src/models/Config.ts` and exported from `src/models/index.ts`. You can override defaults using environment variables:

```typescript
// Configuration interfaces (from src/models/Config.ts)
interface OllamaConfig {
  baseUrl: string;
  embeddingModel: string;
  llmModel: string;
}

interface ChromaConfig {
  url: string;
  collectionName: string;
}

interface ChunkingConfig {
  chunkSize: number;      // characters per chunk
  chunkOverlap: number;   // overlap between chunks
}

interface RetrievalConfig {
  nResults: number;       // number of chunks to retrieve
}

// Default configuration values
{
  ollama: {
    baseUrl: "http://localhost:11434",
    embeddingModel: "mxbai-embed-large",
    llmModel: "gemma3"
  },
  chroma: {
    url: "http://localhost:8000",
    collectionName: "rag_docs"
  },
  chunking: {
    chunkSize: 1000,
    chunkOverlap: 200
  },
  retrieval: {
    nResults: 3
  }
}
```

### Environment Variables

- `OLLAMA_URL`: Override Ollama base URL (default: `http://localhost:11434`)
- `CHROMA_URL`: Override ChromaDB URL (default: `http://localhost:8000`)

## Usage

### 1. Ingest Documents

First, ingest your documents into ChromaDB:

```bash
npm run ingest
```

This will:
- Load `data/YouTube.txt`
- Chunk the text into overlapping segments
- Generate embeddings for each chunk
- Store everything in ChromaDB

**Note**: If documents already exist, the ingestion will be skipped. Use `--force` to re-ingest:

```bash
npm run ingest -- --force
```

Or run directly with tsx:

```bash
tsx src/services/IngestionService.ts --force
```

### 2. Run the CLI

Start the interactive CLI:

```bash
npm start
```

### 3. Ask Questions

Once the CLI is running, you can ask questions:

```
Question: When was YouTube founded?
```

The CLI will display two answers for comparison:
- **RAG Answer**: Generated using retrieved context from your documents
- **Simple Answer**: Generated directly by the LLM without context retrieval

This allows you to compare the quality of RAG-enhanced answers versus direct LLM responses.

Type `exit` or `quit` to exit the CLI.

## Project Structure

```
simple-rag/
├── package.json          # Project configuration and dependencies
├── tsconfig.json         # TypeScript configuration
├── eslint.config.js      # ESLint configuration
├── index.ts              # Application entry point
├── src/
│   ├── cli/
│   │   └── CLI.ts        # Interactive CLI interface
│   ├── models/
│   │   ├── Config.ts     # Configuration interfaces
│   │   └── index.ts      # Barrel export for all models
│   ├── services/
│   │   ├── OllamaService.ts      # Ollama API wrapper (embeddings & generation)
│   │   ├── ChromaService.ts      # ChromaDB client and helpers
│   │   ├── IngestionService.ts   # Document ingestion pipeline
│   │   └── QueryService.ts       # Query processing and RAG pipeline
│   └── utils/
│       ├── Config.ts      # Centralized configuration (TypeScript class)
│       └── ResultCodes.ts # Result code constants
├── data/
│   └── YouTube.txt       # Knowledge source document
└── README.md             # This file
```

### Module Responsibilities

- **`src/models/Config.ts`**: TypeScript interfaces for configuration types (OllamaConfig, ChromaConfig, ChunkingConfig, RetrievalConfig, AppConfig)
- **`src/models/index.ts`**: Barrel export file for all model interfaces
- **`src/utils/Config.ts`**: TypeScript class providing centralized configuration management using interfaces from models
- **`src/services/OllamaService.ts`**: Handles embedding generation and LLM text generation via Ollama API
- **`src/services/ChromaService.ts`**: Manages ChromaDB connections and collection operations
- **`src/services/IngestionService.ts`**: Document loading, chunking, embedding, and storage pipeline
- **`src/services/QueryService.ts`**: Query embedding, similarity search, context assembly, and answer generation (supports both RAG and simple queries)
- **`src/cli/CLI.ts`**: Interactive CLI interface that orchestrates query services and displays results
- **`src/utils/ResultCodes.ts`**: Constants for result codes used throughout the application
- **`index.ts`**: Application entry point that initializes services and starts the CLI

## How It Works

### Chunking Strategy

Documents are split into overlapping chunks to preserve context:
- **Chunk Size**: 1000 characters
- **Overlap**: 200 characters
- This ensures important information at chunk boundaries isn't lost

### Retrieval Process

1. User question is embedded using `mxbai-embed-large`
2. ChromaDB performs cosine similarity search
3. Top 3 most relevant chunks are retrieved
4. Context is assembled with clear separators

### Prompt Engineering

The RAG prompt is designed for Gemma3:
- Clear context boundary
- Explicit instruction to use context
- Fallback for insufficient information
- Simple, direct format

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **"Embedding failed"** | Ensure Ollama is running and `mxbai-embed-large` is installed |
| **"ChromaDB connection failed"** | Verify ChromaDB is running: `docker ps` |
| **"No relevant documents found"** | Run ingestion: `npm run ingest` |
| **Empty search results** | Increase `nResults` in config or check if documents were ingested |
| **Slow embedding** | This is normal for large documents. Consider batch processing for production |
| **Wrong answers** | Check retrieved context quality, adjust `nResults` or chunk size |

### Verification Steps

1. **Check Ollama**:
   ```bash
   ollama list
   curl http://localhost:11434/api/tags
   ```

2. **Check ChromaDB**:
   ```bash
   docker ps | grep chroma
   curl http://localhost:8000/api/v1/heartbeat
   ```

3. **Check ingested documents**:
   After ingestion, you should see: `✓ Ingested X chunks successfully`

## Development

### Scripts

- `npm start`: Run the interactive CLI (uses tsx to execute TypeScript directly)
- `npm run ingest`: Ingest documents into ChromaDB
- `npm run build`: Compile TypeScript to JavaScript (outputs to `dist/`)
- `npm run type-check`: Type check TypeScript without emitting files
- `npm run lint`: Run ESLint on TypeScript files
- `npm run lint:fix`: Run ESLint and automatically fix issues

### Adding New Documents

1. Place your document in the `data/` directory
2. Update `src/services/IngestionService.ts` to point to your file, or modify the default path in the `ingest()` method call
3. Run `npm run ingest`

### Customizing Chunking

Modify `src/utils/Config.ts`:
- `chunkSize`: Larger = more context per chunk, fewer chunks
- `chunkOverlap`: Larger = more redundancy, better context preservation

The configuration is defined in the `Config` class constructor. You can also override values using environment variables (`OLLAMA_URL`, `CHROMA_URL`).

## Production Considerations

This is a minimal implementation. For production use, consider:

- **Batch Embedding**: Process multiple chunks in parallel
- **Streaming Responses**: Stream LLM output for better UX
- **Metadata Filtering**: Add metadata to chunks for advanced filtering
- **Re-ingestion Detection**: Track document versions to avoid unnecessary re-processing
- **Error Recovery**: Retry logic for transient failures
- **Logging**: Add structured logging for debugging
- **Performance Monitoring**: Track embedding and query times

## License

This project is provided as-is for educational and development purposes.

## Acknowledgments

- [Ollama](https://ollama.ai) for local LLM inference
- [ChromaDB](https://www.trychroma.com/) for vector storage
- Google's Gemma models
- Mixedbread AI's mxbai-embed-large embedding model

