import { OllamaService } from "./OllamaService.js";
import { ChromaService } from "./ChromaService.js";
import { Config } from "../utils/Config.js";
import { ResultCodes } from "../utils/ResultCodes.js";

export class QueryService {
  constructor(
    private ollamaService: OllamaService,
    private chromaService: ChromaService,
    private config: Config
  ) {}

  async ask(question: string): Promise<string> {
    const collection = await this.chromaService.getCollection();
    const queryEmbedding = await this.ollamaService.embed(question);
    
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: this.config.retrieval.nResults
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
    
    return await this.ollamaService.generate(prompt);
  }

  async askSimple(question: string): Promise<string> {
    return await this.ollamaService.generate(question);
  }
}

