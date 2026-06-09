import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  loadAiSettings,
  loadDefaultDateRangeSetting,
  loadSetting,
  saveDefaultDateRangeSetting,
  saveSetting,
  SETTING_KEYS,
} from "../../src/renderer/lib/settings-db";
import { SCOUT_DEFAULT_DATE_RANGE_KEY } from "../../src/renderer/lib/scout-settings";

const mockInvoke = vi.fn();

const UPSERT_SQL = `
INSERT INTO settings (key, value) VALUES (?, ?)
ON CONFLICT(key) DO UPDATE SET value = excluded.value
`;

beforeEach(() => {
  mockInvoke.mockReset();
  Object.defineProperty(window, "api", {
    configurable: true,
    value: { invoke: mockInvoke },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("settings-db", () => {
  it("loadSetting returns value from database", async () => {
    mockInvoke.mockResolvedValue([{ value: "ollama" }]);

    const result = await loadSetting(SETTING_KEYS.aiBackend);

    expect(mockInvoke).toHaveBeenCalledWith("db:query", {
      sql: "SELECT value FROM settings WHERE key = ?",
      params: [SETTING_KEYS.aiBackend],
    });
    expect(result).toBe("ollama");
  });

  it("saveSetting uses upsert SQL and params", async () => {
    mockInvoke.mockResolvedValue({ changes: 1, lastInsertRowid: 1 });

    await saveSetting(SETTING_KEYS.aiBackend, "anthropic");

    expect(mockInvoke).toHaveBeenCalledWith("db:query", {
      sql: UPSERT_SQL,
      params: [SETTING_KEYS.aiBackend, "anthropic"],
    });
  });

  it("loadAiSettings returns defaults when keys are missing", async () => {
    mockInvoke.mockResolvedValue([]);

    const result = await loadAiSettings();

    expect(result).toEqual({
      backend: "ollama",
      ollamaBaseUrl: "http://localhost:11434",
      ollamaModel: "llama3.2",
    });
  });

  it("loadAiSettings falls back to ollama when backend value is invalid", async () => {
    mockInvoke.mockImplementation((_channel: string, payload: { params?: unknown[] }) => {
      const key = payload.params?.[0];
      if (key === SETTING_KEYS.aiBackend) {
        return Promise.resolve([{ value: "openai" }]);
      }
      return Promise.resolve([]);
    });

    const result = await loadAiSettings();

    expect(result).toEqual({
      backend: "ollama",
      ollamaBaseUrl: "http://localhost:11434",
      ollamaModel: "llama3.2",
    });
  });

  it("loadAiSettings returns stored values", async () => {
    mockInvoke.mockImplementation((_channel: string, payload: { params?: unknown[] }) => {
      const key = payload.params?.[0];
      if (key === SETTING_KEYS.aiBackend) {
        return Promise.resolve([{ value: "anthropic" }]);
      }
      if (key === SETTING_KEYS.ollamaBaseUrl) {
        return Promise.resolve([{ value: "http://ollama.local:11434" }]);
      }
      if (key === SETTING_KEYS.ollamaModel) {
        return Promise.resolve([{ value: "mistral" }]);
      }
      return Promise.resolve([]);
    });

    const result = await loadAiSettings();

    expect(result).toEqual({
      backend: "anthropic",
      ollamaBaseUrl: "http://ollama.local:11434",
      ollamaModel: "mistral",
    });
  });

  it("loadDefaultDateRangeSetting returns stored valid value", async () => {
    mockInvoke.mockResolvedValue([{ value: "7d" }]);

    const result = await loadDefaultDateRangeSetting();

    expect(result).toBe("7d");
  });

  it("loadDefaultDateRangeSetting falls back to 30d when invalid", async () => {
    mockInvoke.mockResolvedValue([{ value: "365d" }]);

    const result = await loadDefaultDateRangeSetting();

    expect(result).toBe("30d");
  });

  it("saveDefaultDateRangeSetting persists scout.default_date_range", async () => {
    mockInvoke.mockResolvedValue({ changes: 1, lastInsertRowid: 1 });

    await saveDefaultDateRangeSetting("7d");

    expect(mockInvoke).toHaveBeenCalledWith("db:query", {
      sql: UPSERT_SQL,
      params: [SCOUT_DEFAULT_DATE_RANGE_KEY, "7d"],
    });
  });
});
