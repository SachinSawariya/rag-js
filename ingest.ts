import fs from "fs";
import { fileURLToPath } from "url";
import { embed } from "./ollama.js";
import { getCollection, getCollectionCount } from "./chroma.js";
import { config } from "./config.js";
import { ResultCodes } from "./result-codes.js";

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
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

export async function ingest(filePath: string = "./data/YouTube.txt", force: boolean = false): Promise<void> {
  const collection = await getCollection();
  const existingCount = await getCollectionCount(collection);
  
  if (existingCount > 0 && !force) {
    console.log(`Collection already has ${existingCount} documents. Use --force to re-ingest.`);
    return;
  }
  
  let workingCollection = collection;
  if (force && existingCount > 0) {
    console.log("Clearing existing collection...");
    await collection.delete();
    workingCollection = await getCollection();
  }
  
  const text = fs.readFileSync(filePath, "utf-8");
  const chunks = chunkText(text, config.chunking.chunkSize, config.chunking.chunkOverlap);
  
  console.log(`Ingesting ${chunks.length} chunks...`);
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await embed(chunk);
    
    await workingCollection.add({
      ids: [`chunk-${i}`],
      documents: [chunk],
      embeddings: [embedding]
    });
    
    if ((i + 1) % 10 === 0) {
      console.log(`Progress: ${i + 1}/${chunks.length} chunks`);
    }
  }
  
  console.log(`✓ Ingested ${chunks.length} chunks successfully`);
}

// Allow running as script
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const force = process.argv.includes("--force");
  ingest("./data/YouTube.txt", force).catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(errorMessage);
  });
}

