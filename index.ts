import { Config } from "./src/utils/Config.js";
import { OllamaService } from "./src/services/OllamaService.js";
import { ChromaService } from "./src/services/ChromaService.js";
import { QueryService } from "./src/services/QueryService.js";
import { CLI } from "./src/cli/CLI.js";
import { IngestionService } from './src/services/IngestionService.js'
import express, { Request, Response } from "express";
import { uploadPdf } from "./src/middleware/upload.js"

const app = express();
app.use(express.json());

let cli: CLI | null = null;
let ingestService: IngestionService | null = null

// 🔹 Initialize services FIRST
async function main(): Promise<void> {
  const config = new Config();
  const ollamaService = new OllamaService(config);
  const chromaService = new ChromaService(config);
  const queryService = new QueryService(
    ollamaService,
    chromaService,
    config
  );
  ingestService = new IngestionService(ollamaService, chromaService, config);

  cli = new CLI(queryService);
  console.log("✅ Services initialized");
}

// 🔹 API endpoint
app.post("/chat", async (req: Request, res: Response): Promise<void> => {
  if (!cli) {
    res.status(503).json({ error: "Server not ready yet" });
    return;
  }

  const question = String(req.body?.question || "").trim();

  if (!question) {
    res.status(400).json({ error: "Question is required" });
    return;
  }

  try {
    const answer = await cli.askOnce(question);
    res.json(answer);
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Error processing the question" });
  }
});

app.post(
  "/file-upload",
  uploadPdf.single("file"),
  (req: Request, res: Response): void => {
    if (!req.file) {
      res.status(400).json({ error: "PDF file is required" });
      return;
    }

    if (!ingestService) {
      res.status(503).json({ error: "ingestService not ready yet" });
      return;
    }
    const force = process.argv.includes("--force");
    ingestService.ingest(`data/${req.file.filename}`, force).catch((error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(errorMessage);
    });

    res.json({
      message: "PDF uploaded successfully",
      fileName: req.file.filename,
      filePath: `data/${req.file.filename}`,
      size: req.file.size,
    });
  }
);


async function startServer() {
  try {
    await main();

    app.listen(3000, () => {
      console.log("🚀 Server running on port 3000");
    });
  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
  }
}

startServer();