import type { AiConfig } from "../types";
import { createAnthropicBackend } from "./anthropic";
import { createOllamaBackend, type FetchFn } from "./ollama";
import type { AiBackend } from "./types";

export function createAiBackend(
  config: AiConfig,
  fetchFn?: FetchFn
): AiBackend {
  if (config.backend === "anthropic") {
    return createAnthropicBackend(config, fetchFn);
  }
  return createOllamaBackend(config, fetchFn);
}
