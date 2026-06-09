import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { listOllamaModels } from "../../src/main/ollama.js";

describe("listOllamaModels", () => {
  it("parses model names from tags response", async () => {
    const fetchFn = (async (url: string) => {
      assert.equal(url, "http://localhost:11434/api/tags");
      return new Response(
        JSON.stringify({
          models: [{ name: "llama3.2" }, { name: "mistral" }, { name: "" }],
        }),
        { status: 200 }
      );
    }) as typeof fetch;

    const result = await listOllamaModels("http://localhost:11434/", fetchFn);

    assert.deepEqual(result, { models: ["llama3.2", "mistral"] });
  });

  it("returns empty models array when tags response has no models", async () => {
    const fetchFn = (async () =>
      new Response(JSON.stringify({}), { status: 200 })) as typeof fetch;

    const result = await listOllamaModels("http://localhost:11434", fetchFn);

    assert.deepEqual(result, { models: [] });
  });

  it("returns error on non-success HTTP status", async () => {
    const fetchFn = (async () =>
      new Response("not found", { status: 404 })) as typeof fetch;

    const result = await listOllamaModels("http://localhost:11434", fetchFn);

    assert.ok("error" in result);
    assert.match(result.error, /Ollama HTTP 404/);
  });

  it("returns error on network failure", async () => {
    const fetchFn = (async () => {
      throw new Error("connection refused");
    }) as typeof fetch;

    const result = await listOllamaModels("http://localhost:11434", fetchFn);

    assert.deepEqual(result, { error: "connection refused" });
  });
});
