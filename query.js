import { embed, generate } from "./ollama.js";
import { getCollection } from "./chroma.js";
import { config } from "./config.js";

export async function ask(question) {
  const collection = await getCollection();
  const queryEmbedding = await embed(question);
  
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: config.retrieval.nResults
  });
  
  if (!results.documents || results.documents.length === 0) {
    throw new Error("No relevant documents found");
  }
  
  const context = results.documents[0].join("\n\n---\n\n");
  
  const prompt = `Use the following context to answer the question. If the context doesn't contain enough information, say so.

Context:
${context}

Question: ${question}

Answer:`;
  
  return await generate(prompt);
}

export async function askSimple(question) {
  return await generate(question);
}

