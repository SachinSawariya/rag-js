import { ChromaClient } from "chromadb";
import { config } from "./config.js";

const client = new ChromaClient({ path: config.chroma.url });

export async function getCollection() {
  try {
    return await client.getOrCreateCollection({
      name: config.chroma.collectionName
    });
  } catch (error) {
    throw new Error(`ChromaDB connection failed: ${error.message}`);
  }
}

export async function collectionExists() {
  try {
    const collections = await client.listCollections();
    return collections.some(c => c.name === config.chroma.collectionName);
  } catch {
    return false;
  }
}

export async function getCollectionCount(collection) {
  try {
    const count = await collection.count();
    return count;
  } catch {
    return 0;
  }
}

