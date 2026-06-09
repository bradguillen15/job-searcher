import { app } from "electron";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const ANTHROPIC_KEY_NAME = "ANTHROPIC_API_KEY";

export function getUserEnvPath(): string {
  return path.join(app.getPath("userData"), ".env");
}

export function loadUserEnv(): void {
  const envPath = getUserEnvPath();
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

function parseEnvLines(content: string): Array<{ key: string; value: string }> {
  return content
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "" && !line.trimStart().startsWith("#"))
    .map((line) => {
      const eqIndex = line.indexOf("=");
      if (eqIndex === -1) {
        return { key: line.trim(), value: "" };
      }
      return {
        key: line.slice(0, eqIndex).trim(),
        value: line.slice(eqIndex + 1),
      };
    });
}

function serializeEnvLines(
  entries: Array<{ key: string; value: string }>
): string {
  return entries.map(({ key, value }) => `${key}=${value}`).join("\n") + "\n";
}

export function saveAnthropicApiKey(
  apiKey: string
): { ok: true } | { error: string } {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    return { error: "API key is required" };
  }

  const envPath = getUserEnvPath();
  const existing = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, "utf-8")
    : "";

  const entries = parseEnvLines(existing);
  const index = entries.findIndex((entry) => entry.key === ANTHROPIC_KEY_NAME);

  if (index >= 0) {
    entries[index] = { key: ANTHROPIC_KEY_NAME, value: trimmed };
  } else {
    entries.push({ key: ANTHROPIC_KEY_NAME, value: trimmed });
  }

  fs.mkdirSync(path.dirname(envPath), { recursive: true });
  fs.writeFileSync(envPath, serializeEnvLines(entries), "utf-8");
  process.env[ANTHROPIC_KEY_NAME] = trimmed;

  return { ok: true };
}

export function isAnthropicKeyConfigured(): boolean {
  const value = process.env[ANTHROPIC_KEY_NAME];
  return typeof value === "string" && value.trim().length > 0;
}
