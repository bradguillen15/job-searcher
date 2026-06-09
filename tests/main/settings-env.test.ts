import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";

import {
  getUserEnvPath,
  isAnthropicKeyConfigured,
  loadUserEnv,
  saveAnthropicApiKey,
} from "../../src/main/settings-env.js";

let tempUserData: string;

beforeEach(() => {
  tempUserData = fs.mkdtempSync(path.join(os.tmpdir(), "jobscout-settings-env-"));
  process.env.JOBSCOUT_TEST_USER_DATA = tempUserData;
  delete process.env.ANTHROPIC_API_KEY;
});

afterEach(() => {
  delete process.env.JOBSCOUT_TEST_USER_DATA;
  delete process.env.ANTHROPIC_API_KEY;
  if (fs.existsSync(tempUserData)) {
    fs.rmSync(tempUserData, { recursive: true, force: true });
  }
});

describe("settings-env", () => {
  it("writes a new Anthropic API key to userData .env", () => {
    const result = saveAnthropicApiKey("sk-ant-test-key");

    assert.deepEqual(result, { ok: true });
    assert.equal(process.env.ANTHROPIC_API_KEY, "sk-ant-test-key");

    const envPath = getUserEnvPath();
    assert.ok(fs.existsSync(envPath));
    assert.match(fs.readFileSync(envPath, "utf-8"), /ANTHROPIC_API_KEY=sk-ant-test-key/);
  });

  it("updates an existing Anthropic API key in userData .env", () => {
    const envPath = getUserEnvPath();
    fs.mkdirSync(path.dirname(envPath), { recursive: true });
    fs.writeFileSync(envPath, "ANTHROPIC_API_KEY=old-key\nOTHER=value\n", "utf-8");

    const result = saveAnthropicApiKey("new-key");

    assert.deepEqual(result, { ok: true });
    const content = fs.readFileSync(envPath, "utf-8");
    assert.match(content, /ANTHROPIC_API_KEY=new-key/);
    assert.match(content, /OTHER=value/);
    assert.doesNotMatch(content, /old-key/);
  });

  it("loads userData .env without overriding existing process env", () => {
    const envPath = getUserEnvPath();
    fs.mkdirSync(path.dirname(envPath), { recursive: true });
    fs.writeFileSync(envPath, "ANTHROPIC_API_KEY=from-file\n", "utf-8");
    process.env.ANTHROPIC_API_KEY = "from-process";

    loadUserEnv();

    assert.equal(process.env.ANTHROPIC_API_KEY, "from-process");
  });

  it("reports configured when ANTHROPIC_API_KEY is set", () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";

    assert.equal(isAnthropicKeyConfigured(), true);
  });

  it("reports not configured when ANTHROPIC_API_KEY is missing", () => {
    assert.equal(isAnthropicKeyConfigured(), false);
  });

  it("rejects empty API key", () => {
    const result = saveAnthropicApiKey("   ");

    assert.deepEqual(result, { error: "API key is required" });
  });

  it("saveAnthropicApiKey response excludes api key value", () => {
    const result = saveAnthropicApiKey("sk-ant-secret-key");

    assert.deepEqual(result, { ok: true });
    assert.equal("apiKey" in result, false);
    assert.equal("ANTHROPIC_API_KEY" in result, false);
  });

  it("anthropicKeyStatus shape excludes api key value", () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-secret-key";

    const status = { configured: isAnthropicKeyConfigured() };

    assert.deepEqual(status, { configured: true });
    assert.equal("apiKey" in status, false);
    assert.equal("ANTHROPIC_API_KEY" in status, false);
  });
});
