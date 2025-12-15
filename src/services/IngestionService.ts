import fs from "fs";
import { fileURLToPath } from "url";
import { OllamaService } from "./OllamaService.js";
import { ChromaService } from "./ChromaService.js";
import { Config } from "../utils/Config.js";
import { ResultCodes } from "../utils/ResultCodes.js";

export class IngestionService {
  constructor(
    private ollamaService: OllamaService,
    private chromaService: ChromaService,
    private config: Config
  ) {}

  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    // Ensure overlap is less than chunkSize to prevent infinite loops
    const safeOverlap = Math.min(overlap, chunkSize - 1);
    
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end).trim();
      
      if (chunk.length > 0) {
        chunks.push(chunk);
      }
      
      // Move start forward, ensuring we always make progress
      const nextStart = end - safeOverlap;
      if (nextStart <= start) {
        // Safety check: ensure we always advance
        start = end;
      } else {
        start = nextStart;
      }
      
      // Safety check: prevent infinite loops
      if (chunks.length > 1000000) {
        throw new Error(`${ResultCodes.TOO_MANY_CHUNKS}: Too many chunks generated. Check chunking parameters.`);
      }
    }
    
    return chunks;
  }

  async ingest(
    filePath: string = "./data/YouTube.txt",
    onProgress?: (info: {
      stage: 'clearing' | 'chunking' | 'embedding' | 'complete';
      current?: number;
      total?: number;
      message: string;
      percentage?: number;
    }) => void
  ): Promise<void> {
    const collection = await this.chromaService.getCollection();
    const existingCount = await this.chromaService.getCollectionCount(collection);
    
    let workingCollection = collection;
    if (existingCount > 0) {
      console.log("Clearing existing collection...");
      onProgress?.({
        stage: 'clearing',
        message: 'Clearing existing collection...',
        percentage: 0
      });
      await collection.delete();
      workingCollection = await this.chromaService.getCollection();
    }
    
    const text = fs.readFileSync(filePath, "utf-8");
    const chunks = this.chunkText(text, this.config.chunking.chunkSize, this.config.chunking.chunkOverlap);
    
    console.log(`Ingesting ${chunks.length} chunks...`);
    onProgress?.({
      stage: 'chunking',
      total: chunks.length,
      message: `Split document into ${chunks.length} chunks`,
      percentage: 0
    });
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await this.ollamaService.embed(chunk);
      
      await workingCollection.add({
        ids: [`chunk-${i}`],
        documents: [chunk],
        embeddings: [embedding]
      });
      
      const percentage = Math.round(((i + 1) / chunks.length) * 100);
      
      if ((i + 1) % 10 === 0 || i === chunks.length - 1) {
        console.log(`Progress: ${i + 1}/${chunks.length} chunks`);
        onProgress?.({
          stage: 'embedding',
          current: i + 1,
          total: chunks.length,
          message: `Processing chunk ${i + 1}/${chunks.length}`,
          percentage
        });
      }
    }
    
    console.log(`✓ Ingested ${chunks.length} chunks successfully`);
    onProgress?.({
      stage: 'complete',
      total: chunks.length,
      message: `Successfully ingested ${chunks.length} chunks`,
      percentage: 100
    });
  }
}

// Allow running as script
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const config = new Config();
  const ollamaService = new OllamaService(config);
  const chromaService = new ChromaService(config);
  const ingestionService = new IngestionService(ollamaService, chromaService, config);
  
  ingestionService.ingest("./data/YouTube.txt").catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(errorMessage);
  });
}

