import type { AiBackendName } from "../types";

export interface CompleteOptions {
  json?: boolean;
}

export interface AiBackend {
  readonly name: AiBackendName;
  complete(
    systemPrompt: string,
    userPrompt: string,
    options?: CompleteOptions
  ): Promise<string>;
}
