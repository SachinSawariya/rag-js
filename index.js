import readlineSync from "readline-sync";
import { ask } from "./query.js";

async function main() {
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
      const answer = await ask(question);
      console.log("\nAnswer:\n", answer);
    } catch (error) {
      console.error("\nError:", error.message);
    }
  }
}

main().catch(console.error);

