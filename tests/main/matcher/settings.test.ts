import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { db, openDatabase } from "../../../src/main/db.js";
import { loadAiConfig } from "../../../src/main/matcher/settings.js";

describe("matcher settings", () => {
  beforeEach(() => {
    openDatabase(":memory:");
  });

  it("returns ollama defaults when keys are missing", () => {
    const config = loadAiConfig();

    assert.equal(config.backend, "ollama");
    assert.equal(config.ollamaBaseUrl, "http://localhost:11434");
    assert.equal(config.ollamaModel, "llama3.2");
  });

  it("honors stored ai.backend and ollama keys", () => {
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(
      "ai.backend",
      "anthropic"
    );
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(
      "ollama.base_url",
      "http://ollama.local:11434"
    );
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(
      "ollama.model",
      "mistral"
    );

    const config = loadAiConfig();

    assert.equal(config.backend, "anthropic");
    assert.equal(config.ollamaBaseUrl, "http://ollama.local:11434");
    assert.equal(config.ollamaModel, "mistral");
  });
});
