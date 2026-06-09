export type AiBackend = "ollama" | "anthropic";

export const AI_BACKEND_OPTIONS: readonly AiBackend[] = ["ollama", "anthropic"];

export const DEFAULT_AI_BACKEND: AiBackend = "ollama";
export const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";
export const DEFAULT_OLLAMA_MODEL = "llama3.2";

export interface AiSettingsFormValues {
  backend: AiBackend;
  ollamaBaseUrl: string;
  ollamaModel: string;
}

export function isAiBackend(value: string): value is AiBackend {
  return (AI_BACKEND_OPTIONS as readonly string[]).includes(value);
}
