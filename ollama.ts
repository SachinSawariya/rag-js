import { Ollama } from "ollama";
import { config } from "./config.js";
import { ResultCodes } from "./result-codes.js";

const client = new Ollama({ host: config.ollama.baseUrl });

export async function embed(text: string): Promise<number[]> {
  try {
    const response = await client.embeddings({
      model: config.ollama.embeddingModel,
      prompt: text
    });
    return response.embedding;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`${ResultCodes.EMBEDDING_FAILED}: ${errorMessage}`);
  }
}

export async function generate(prompt: string, stream: boolean = false): Promise<string> {
  try {
    if (stream) {
      // For streaming, we'd need to handle the async iterator
      // For now, return empty string as streaming is not fully implemented
      await client.generate({
        model: config.ollama.llmModel,
        prompt,
        stream: true
      });
      return "";
    } else {
      const response = await client.generate({
        model: config.ollama.llmModel,
        prompt,
        stream: false
      });
      return response.response;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`${ResultCodes.GENERATION_FAILED}: ${errorMessage}`);
  }
}

