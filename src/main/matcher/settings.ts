import { db } from "../db";
import type { AiConfig } from "./types";
import {
  DEFAULT_ANTHROPIC_MODEL,
  DEFAULT_OLLAMA_BASE_URL,
  DEFAULT_OLLAMA_MODEL,
} from "./types";

function getSetting(key: string): string | undefined {
  const row = db
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value;
}

export function loadAiConfig(): AiConfig {
  const backendRaw = getSetting("ai.backend") ?? "ollama";
  const backend = backendRaw === "anthropic" ? "anthropic" : "ollama";

  return {
    backend,
    ollamaBaseUrl: getSetting("ollama.base_url") ?? DEFAULT_OLLAMA_BASE_URL,
    ollamaModel: getSetting("ollama.model") ?? DEFAULT_OLLAMA_MODEL,
    anthropicModel: DEFAULT_ANTHROPIC_MODEL,
    anthropicApiKey: process.env["ANTHROPIC_API_KEY"],
  };
}
