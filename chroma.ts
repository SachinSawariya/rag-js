import { ChromaClient, Collection } from "chromadb";
import { config } from "./config.js";

const client = new ChromaClient({ path: config.chroma.url });

export async function getCollection(): Promise<Collection> {
  try {
    return await client.getOrCreateCollection({
      name: config.chroma.collectionName
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`ChromaDB connection failed: ${errorMessage}`);
  }
}

export async function collectionExists(): Promise<boolean> {
  try {
    const collections = await client.listCollections();
    return collections.includes(config.chroma.collectionName);
  } catch {
    return false;
  }
}

export async function getCollectionCount(collection: Collection): Promise<number> {
  try {
    const count = await collection.count();
    return count;
  } catch {
    return 0;
  }
}

