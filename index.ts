import { Config } from "./src/utils/Config.js";
import { OllamaService } from "./src/services/OllamaService.js";
import { ChromaService } from "./src/services/ChromaService.js";
import { QueryService } from "./src/services/QueryService.js";
import { CLI } from "./src/cli/CLI.js";

async function main(): Promise<void> {
  const config = new Config();
  const ollamaService = new OllamaService(config);
  const chromaService = new ChromaService(config);
  const queryService = new QueryService(ollamaService, chromaService, config);
  const cli = new CLI(queryService);
  
  await cli.run();
}

main().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(errorMessage);
});
