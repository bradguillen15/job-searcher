import type { AiConfig } from "../types";
import { AiBackendError } from "../types";
import type { AiBackend } from "./types";
import type { FetchFn } from "./ollama";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const REQUEST_TIMEOUT_MS = 120_000;

export function createAnthropicBackend(
  config: AiConfig,
  fetchFn: FetchFn = fetch
): AiBackend {
  return {
    name: "anthropic",
    async complete(systemPrompt: string, userPrompt: string): Promise<string> {
      if (!config.anthropicApiKey) {
        throw new AiBackendError(
          "ANTHROPIC_API_KEY is not set in the environment"
        );
      }

      let response: Response;
      try {
        response = await fetchFn(ANTHROPIC_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": config.anthropicApiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: config.anthropicModel,
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch (err) {
        throw new AiBackendError(
          `Anthropic request failed: ${(err as Error).message}`,
          err
        );
      }

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new AiBackendError(
          `Anthropic HTTP ${response.status}${text ? `: ${text}` : ""}`
        );
      }

      const data = (await response.json()) as {
        content?: Array<{ type?: string; text?: string }>;
      };

      const text = data.content?.[0]?.text;
      if (typeof text !== "string") {
        throw new AiBackendError("Anthropic response missing content text");
      }

      return text;
    },
  };
}
