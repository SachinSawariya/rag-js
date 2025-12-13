import { Ollama } from "ollama";
import { config } from "./config.js";

const client = new Ollama({ host: config.ollama.baseUrl });

export async function embed(text) {
  try {
    const response = await client.embeddings({
      model: config.ollama.embeddingModel,
      prompt: text
    });
    return response.embedding;
  } catch (error) {
    throw new Error(`Embedding failed: ${error.message}`);
  }
}

export async function generate(prompt, stream = false) {
  try {
    const response = await client.generate({
      model: config.ollama.llmModel,
      prompt,
      stream
    });
    return stream ? response : response.response;
  } catch (error) {
    throw new Error(`Generation failed: ${error.message}`);
  }
}

