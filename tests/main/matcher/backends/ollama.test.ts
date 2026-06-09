import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createOllamaBackend } from "../../../../src/main/matcher/backends/ollama.js";
import type { AiConfig } from "../../../../src/main/matcher/types.js";

const baseConfig: AiConfig = {
  backend: "ollama",
  ollamaBaseUrl: "http://localhost:11434",
  ollamaModel: "llama3.2",
  anthropicModel: "claude-3-5-haiku-20241022",
  anthropicApiKey: undefined,
};

describe("ollama backend", () => {
  it("posts to /api/chat with model and messages", async () => {
    let capturedUrl = "";
    let capturedBody: Record<string, unknown> = {};

    const fetchFn = (async (url: string, init?: RequestInit) => {
      capturedUrl = url;
      capturedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(
        JSON.stringify({ message: { content: "profile text" } }),
        { status: 200 }
      );
    }) as typeof fetch;

    const backend = createOllamaBackend(baseConfig, fetchFn);
    const result = await backend.complete("system", "user");

    assert.equal(capturedUrl, "http://localhost:11434/api/chat");
    assert.equal(capturedBody["model"], "llama3.2");
    assert.deepEqual(capturedBody["messages"], [
      { role: "system", content: "system" },
      { role: "user", content: "user" },
    ]);
    assert.equal(result, "profile text");
  });

  it("includes format json when requested", async () => {
    let capturedBody: Record<string, unknown> = {};

    const fetchFn = (async (_url: string, init?: RequestInit) => {
      capturedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(
        JSON.stringify({ message: { content: "{}" } }),
        { status: 200 }
      );
    }) as typeof fetch;

    const backend = createOllamaBackend(baseConfig, fetchFn);
    await backend.complete("system", "user", { json: true });

    assert.equal(capturedBody["format"], "json");
  });

  it("throws AiBackendError on HTTP failure", async () => {
    const fetchFn = (async () =>
      new Response("error", { status: 500 })) as typeof fetch;

    const backend = createOllamaBackend(baseConfig, fetchFn);

    await assert.rejects(
      () => backend.complete("system", "user"),
      (err: Error) => err.name === "AiBackendError"
    );
  });
});
