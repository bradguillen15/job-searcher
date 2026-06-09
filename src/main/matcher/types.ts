export const BATCH_SIZE = 5;
export const MATCH_REASON_THRESHOLD = 70;
export const MAX_MATCH_REASON_CALLS = 10;
export const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";
export const DEFAULT_OLLAMA_MODEL = "llama3.2";
export const DEFAULT_ANTHROPIC_MODEL = "claude-3-5-haiku-20241022";
export const RESUME_TEXT_MAX_CHARS = 12_000;

export type AiBackendName = "ollama" | "anthropic";

export interface AiConfig {
  backend: AiBackendName;
  ollamaBaseUrl: string;
  ollamaModel: string;
  anthropicModel: string;
  anthropicApiKey: string | undefined;
}

export interface MatchingResult {
  totalMatched: number;
  skipped: boolean;
  skipReason?: string;
}

export interface ResumeRow {
  id: number;
  raw_text: string;
  skill_profile: string | null;
}

export interface JobForScoring {
  id: number;
  title: string;
  company: string | null;
  location: string | null;
  description: string | null;
}

export class AiBackendError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "AiBackendError";
  }
}
