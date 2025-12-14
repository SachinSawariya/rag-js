import readlineSync from "readline-sync";
import { QueryService } from "../services/QueryService.js";

type AnswerResult = {
  ragAnswer?: string;
  simpleAnswer?: string;
};

export class CLI {
  constructor(private queryService: QueryService) { }

  // ✅ COMMON FUNCTION (single source of truth)
  private async processQuestion(
    question: string,
    logToConsole = false
  ): Promise<AnswerResult> {
    console.log(logToConsole ? "\nThinking..." : undefined);

    const [ragAnswer, simpleAnswer] = await Promise.allSettled([
      this.queryService.ask(question),
      this.queryService.askSimple(question),
    ]);

    const result: AnswerResult = {};

    if (ragAnswer.status === "fulfilled") {
      result.ragAnswer = ragAnswer.value;
      if (logToConsole) {
        console.log("\nRAG Answer:\n", ragAnswer.value);
      }
    } else if (logToConsole) {
      console.error(
        "\nRAG Answer Error:",
        ragAnswer.reason instanceof Error
          ? ragAnswer.reason.message
          : String(ragAnswer.reason)
      );
    }

    if (simpleAnswer.status === "fulfilled") {
      result.simpleAnswer = simpleAnswer.value;
      if (logToConsole) {
        console.log("\nSimple Answer:\n", simpleAnswer.value);
      }
    } else if (logToConsole) {
      console.error(
        "\nSimple Answer Error:",
        simpleAnswer.reason instanceof Error
          ? simpleAnswer.reason.message
          : String(simpleAnswer.reason)
      );
    }

    return result;
  }

  // 🖥️ CLI MODE (interactive)
  async run(): Promise<void> {
    console.log("RAG CLI - Ask questions about YouTube\nType 'exit' to quit\n");

    while (true) {
      const question = readlineSync.question("\nQuestion: ").trim();

      if (["exit", "quit"].includes(question.toLowerCase())) {
        console.log("Goodbye!");
        break;
      }

      if (!question) continue;

      try {
        await this.processQuestion(question, true);
      } catch (error) {
        console.error(
          "\nError:",
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  }

  // 🌐 API MODE (single request)
  async askOnce(question: string): Promise<AnswerResult> {
    if (!question?.trim()) {
      throw new Error("Question is required");
    }
    return this.processQuestion(question.trim(), true);
  }
}