import { Config } from "./src/utils/Config.js";
import { OllamaService } from "./src/services/OllamaService.js";
import { ChromaService } from "./src/services/ChromaService.js";
import { QueryService } from "./src/services/QueryService.js";
import { IngestionService } from './src/services/IngestionService.js'
import express, { Request, Response } from "express";
import { uploadTxt } from "./src/middleware/upload.js"
import cors from "cors";

const app = express();

// Enable CORS for Angular frontend
app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());


let ingestService: IngestionService | null = null;
let queryService: QueryService | null = null;

// 🔹 Initialize services FIRST
function main(): void {
  const config = new Config();
  const ollamaService = new OllamaService(config);
  const chromaService = new ChromaService(config);
  queryService = new QueryService(
    ollamaService,
    chromaService,
    config
  );
  ingestService = new IngestionService(ollamaService, chromaService, config);


  console.log("✅ Services initialized");
}

// 🔹 API endpoint
app.post("/chat", async (req: Request, res: Response): Promise<void> => {
  if (!queryService) {
    res.status(503).json({ error: "Server not ready yet" });
    return;
  }

  const history = (req.body as { history?: { role: string; content: string }[] })?.history;

  if (!history || !Array.isArray(history) || history.length === 0) {
    res.status(400).json({ error: "Chat history is required" });
    return;
  }

  try {
    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    const stream = queryService.askStream(history);

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }
    
    res.end();
  } catch (error) {
    console.error("Chat error:", error);
    // If headers already sent, we can't send JSON error, but we can close stream
    if (!res.headersSent) {
      res.status(500).json({ error: "Error processing the question" });
    } else {
      res.end();
    }
  }
});

app.post(
  "/file-upload",
  uploadTxt.single("file"),
  (req: Request, res: Response): void => {
    if (!req.file) {
      res.status(400).json({ error: "TXT file is required" });
      return;
    }

    if (!ingestService) {
      res.status(503).json({ error: "ingestService not ready yet" });
      return;
    }
    ingestService.ingest(`data/${req.file.filename}`).catch((error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(errorMessage);
    });

    res.json({
      message: "TXT uploaded successfully. Wait a while for the ingestion to complete.",
      fileName: req.file.filename,
      filePath: `data/${req.file.filename}`,
      size: req.file.size,
    });
  }
);

// SSE endpoint for real-time progress updates
app.post(
  "/upload-progress",
  uploadTxt.single("file"),
  (req: Request, res: Response): void => {
    if (!req.file) {
      res.status(400).json({ error: "TXT file is required" });
      return;
    }

    if (!ingestService) {
      res.status(503).json({ error: "ingestService not ready yet" });
      return;
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ stage: 'start', message: 'Starting upload...', percentage: 0 })}\n\n`);

    // Start ingestion with progress callback
    ingestService.ingest(`data/${req.file.filename}`, (progressInfo) => {
      // Send progress event
      res.write(`data: ${JSON.stringify(progressInfo)}\n\n`);
      
      // Close connection when complete
      if (progressInfo.stage === 'complete') {
        res.end();
      }
    }).catch((error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Ingestion error:", errorMessage);
      
      // Send error event
      res.write(`data: ${JSON.stringify({ 
        stage: 'error', 
        message: errorMessage,
        percentage: 0
      })}\n\n`);
      res.end();
    });
  }
);

async function healthCheck(): Promise<void> {
  const ollamaResponse = await fetch("http://localhost:11434/api/tags");
  if (!ollamaResponse.ok) {
    throw new Error("Ollama is not running");
  }
  const chromaResponse = await fetch("http://localhost:8000/api/v2/heartbeat");
  if (!chromaResponse.ok) {
    throw new Error("Chroma is not running");
  }
  console.log("Ollama and Chroma are running");
}


async function startServer(): Promise<void> {
  try {
    await healthCheck();
    main();

    app.listen(3000, () => {
      console.log("🚀 Server running on port 3000");
    });
  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
  }
}

void startServer();