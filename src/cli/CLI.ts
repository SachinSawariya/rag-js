import readlineSync from "readline-sync";
import { QueryService } from "../services/QueryService.js";

type AnswerResult = {
  ragAnswer?: string;
  simpleAnswer?: string;
};

export class CLI {
  constructor(private queryService: QueryService) { }

  getAnswerResult(answer: PromiseSettledResult<string>): string {
    if (answer.status === "fulfilled") {
      return answer.value;
    } else {
      return answer.reason instanceof Error ? answer.reason.message : String(answer.reason);
    }
  }

  // ✅ COMMON FUNCTION (single source of truth)
  private async processQuestion(
    question: string
  ): Promise<AnswerResult> {
    console.log(question);

    const [ragAnswer, simpleAnswer] = await Promise.allSettled([
      this.queryService.ask(question),
      this.queryService.askSimple(question),
    ]);

    const result: AnswerResult = {
      ragAnswer: this.getAnswerResult(ragAnswer),
      simpleAnswer: this.getAnswerResult(simpleAnswer),
    };

    console.log(result);

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
        await this.processQuestion(question);
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
    return this.processQuestion(question.trim());
  }
}