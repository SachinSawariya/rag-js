export const config = {
  ollama: {
    baseUrl: process.env.OLLAMA_URL || "http://localhost:11434",
    embeddingModel: "mxbai-embed-large",
    llmModel: "gemma3"
  },
  chroma: {
    url: process.env.CHROMA_URL || "http://localhost:8000",
    collectionName: "rag_docs"
  },
  chunking: {
    chunkSize: 1000,      // characters per chunk
    chunkOverlap: 200     // overlap between chunks
  },
  retrieval: {
    nResults: 3           // number of chunks to retrieve
  }
};

