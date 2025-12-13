import readlineSync from "readline-sync";
import { ask, askSimple } from "./query.js";

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
      
      // Get both RAG and simple answers
      const [ragAnswer, simpleAnswer] = await Promise.allSettled([
        ask(question),
        askSimple(question)
      ]);
      
      // Display RAG Answer
      if (ragAnswer.status === "fulfilled") {
        console.log("\nRAG Answer:\n", ragAnswer.value);
      } else {
        console.error("\nRAG Answer Error:", ragAnswer.reason.message);
      }
      
      // Display Simple Answer
      if (simpleAnswer.status === "fulfilled") {
        console.log("\nSimple Answer:\n", simpleAnswer.value);
      } else {
        console.error("\nSimple Answer Error:", simpleAnswer.reason.message);
      }
    } catch (error) {
      console.error("\nError:", error.message);
    }
  }
}

main().catch(console.error);

