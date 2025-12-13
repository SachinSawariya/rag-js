import { embed, generate } from "./ollama.js";
import { getCollection } from "./chroma.js";
import { config } from "./config.js";
import { ResultCodes } from "./result-codes.js";

export async function ask(question: string): Promise<string> {
  const collection = await getCollection();
  const queryEmbedding = await embed(question);
  
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: config.retrieval.nResults
  });
  
  if (results.documents === undefined || results.documents.length === 0 || results.documents[0] === undefined || results.documents[0].length === 0) {
    throw new Error(ResultCodes.NO_RELEVANT_DOCUMENTS);
  }
  
  const context = results.documents[0].join("\n\n---\n\n");
  
  const prompt = `
Use the following context to answer the question. If the context doesn't contain enough information, say so.

Context:
${context}

Question: ${question}

Answer:
`;
  
  return await generate(prompt);
}

export async function askSimple(question: string): Promise<string> {
  return await generate(question);
}

