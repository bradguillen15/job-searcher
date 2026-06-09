import type { AiConfig } from "../types";
import { AiBackendError } from "../types";
import type { AiBackend, CompleteOptions } from "./types";

const REQUEST_TIMEOUT_MS = 120_000;

export type FetchFn = typeof fetch;

export function createOllamaBackend(
  config: AiConfig,
  fetchFn: FetchFn = fetch
): AiBackend {
  const baseUrl = config.ollamaBaseUrl.replace(/\/$/, "");

  return {
    name: "ollama",
    async complete(
      systemPrompt: string,
      userPrompt: string,
      options?: CompleteOptions
    ): Promise<string> {
      const body: Record<string, unknown> = {
        model: config.ollamaModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      };

      if (options?.json) {
        body["format"] = "json";
      }

      let response: Response;
      try {
        response = await fetchFn(`${baseUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch (err) {
        throw new AiBackendError(
          `Ollama request failed: ${(err as Error).message}`,
          err
        );
      }

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new AiBackendError(
          `Ollama HTTP ${response.status}${text ? `: ${text}` : ""}`
        );
      }

      const data = (await response.json()) as {
        message?: { content?: string };
      };

      const content = data.message?.content;
      if (typeof content !== "string") {
        throw new AiBackendError("Ollama response missing message.content");
      }

      return content;
    },
  };
}
