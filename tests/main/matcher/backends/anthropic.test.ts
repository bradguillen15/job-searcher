import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createAnthropicBackend } from "../../../../src/main/matcher/backends/anthropic.js";
import type { AiConfig } from "../../../../src/main/matcher/types.js";

describe("anthropic backend", () => {
  it("posts to messages API with required headers", async () => {
    let capturedUrl = "";
    let capturedHeaders: Record<string, string> = {};
    let capturedBody: Record<string, unknown> = {};

    const fetchFn = (async (url: string, init?: RequestInit) => {
      capturedUrl = url;
      capturedHeaders = init?.headers as Record<string, string>;
      capturedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(
        JSON.stringify({ content: [{ type: "text", text: "reason text" }] }),
        { status: 200 }
      );
    }) as typeof fetch;

    const config: AiConfig = {
      backend: "anthropic",
      ollamaBaseUrl: "http://localhost:11434",
      ollamaModel: "llama3.2",
      anthropicModel: "claude-3-5-haiku-20241022",
      anthropicApiKey: "test-key",
    };

    const backend = createAnthropicBackend(config, fetchFn);
    const result = await backend.complete("system prompt", "user prompt");

    assert.equal(capturedUrl, "https://api.anthropic.com/v1/messages");
    assert.equal(capturedHeaders["x-api-key"], "test-key");
    assert.equal(capturedHeaders["anthropic-version"], "2023-06-01");
    assert.equal(capturedBody["system"], "system prompt");
    assert.equal(result, "reason text");
  });

  it("throws when API key is missing", async () => {
    const config: AiConfig = {
      backend: "anthropic",
      ollamaBaseUrl: "http://localhost:11434",
      ollamaModel: "llama3.2",
      anthropicModel: "claude-3-5-haiku-20241022",
      anthropicApiKey: undefined,
    };

    const backend = createAnthropicBackend(config);

    await assert.rejects(
      () => backend.complete("system", "user"),
      (err: Error) => err.name === "AiBackendError"
    );
  });
});
