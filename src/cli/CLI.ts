import readlineSync from "readline-sync";
import { QueryService } from "../services/QueryService.js";

export class CLI {
  constructor(private queryService: QueryService) {}

  async run(): Promise<void> {
    console.log("RAG CLI - Ask questions about YouTube\nType 'exit' to quit\n");
    
    while (true) {
      const question = readlineSync.question("\nQuestion: ");
      
      if (question.toLowerCase() === "exit" || question.toLowerCase() === "quit") {
        console.log("Goodbye!");
        break;
      }
      
      if (!question.trim()) {
        continue;
      }
      
      try {
        console.log("\nThinking...");
        
        // Get both RAG and simple answers
        const [ragAnswer, simpleAnswer] = await Promise.allSettled([
          this.queryService.ask(question),
          this.queryService.askSimple(question)
        ]);
        
        // Display RAG Answer
        if (ragAnswer.status === "fulfilled") {
          console.log("\nRAG Answer:\n", ragAnswer.value);
        } else {
          const errorMessage = ragAnswer.reason instanceof Error ? ragAnswer.reason.message : String(ragAnswer.reason);
          console.error("\nRAG Answer Error:", errorMessage);
        }
        
        // Display Simple Answer
        if (simpleAnswer.status === "fulfilled") {
          console.log("\nSimple Answer:\n", simpleAnswer.value);
        } else {
          const errorMessage = simpleAnswer.reason instanceof Error ? simpleAnswer.reason.message : String(simpleAnswer.reason);
          console.error("\nSimple Answer Error:", errorMessage);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("\nError:", errorMessage);
      }
    }
  }
}

