import { SCOUT_DEFAULT_DATE_RANGE_KEY } from "@/lib/scout-settings";
import {
  DATE_RANGE_OPTIONS,
  type DateRangeKey,
} from "@/types/scout";
import {
  DEFAULT_AI_BACKEND,
  DEFAULT_OLLAMA_BASE_URL,
  DEFAULT_OLLAMA_MODEL,
  isAiBackend,
  type AiBackend,
  type AiSettingsFormValues,
} from "@/types/settings";

export const SETTING_KEYS = {
  aiBackend: "ai.backend",
  ollamaBaseUrl: "ollama.base_url",
  ollamaModel: "ollama.model",
  scoutDefaultDateRange: SCOUT_DEFAULT_DATE_RANGE_KEY,
} as const;

export type SettingsDbError = { error: string };

const LOAD_SETTING_SQL = "SELECT value FROM settings WHERE key = ?";

const UPSERT_SETTING_SQL = `
INSERT INTO settings (key, value) VALUES (?, ?)
ON CONFLICT(key) DO UPDATE SET value = excluded.value
`;

const DEFAULT_DATE_RANGE: DateRangeKey = "30d";

function isDbQueryError(
  result: unknown
): result is SettingsDbError {
  return (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    typeof (result as SettingsDbError).error === "string"
  );
}

function isValidDateRange(value: string): value is DateRangeKey {
  return (DATE_RANGE_OPTIONS as readonly string[]).includes(value);
}

export async function loadSetting(key: string): Promise<string | null> {
  const result = await window.api.invoke("db:query", {
    sql: LOAD_SETTING_SQL,
    params: [key],
  });

  if (isDbQueryError(result)) {
    throw new Error(result.error);
  }

  const rows = result as Array<{ value: string }>;
  return rows[0]?.value ?? null;
}

export async function saveSetting(key: string, value: string): Promise<void> {
  const result = await window.api.invoke("db:query", {
    sql: UPSERT_SETTING_SQL,
    params: [key, value],
  });

  if (isDbQueryError(result)) {
    throw new Error(result.error);
  }
}

export async function loadAiSettings(): Promise<AiSettingsFormValues> {
  const [backendRaw, ollamaBaseUrlRaw, ollamaModelRaw] = await Promise.all([
    loadSetting(SETTING_KEYS.aiBackend),
    loadSetting(SETTING_KEYS.ollamaBaseUrl),
    loadSetting(SETTING_KEYS.ollamaModel),
  ]);

  const backend: AiBackend =
    backendRaw && isAiBackend(backendRaw) ? backendRaw : DEFAULT_AI_BACKEND;

  return {
    backend,
    ollamaBaseUrl: ollamaBaseUrlRaw ?? DEFAULT_OLLAMA_BASE_URL,
    ollamaModel: ollamaModelRaw ?? DEFAULT_OLLAMA_MODEL,
  };
}

export async function loadDefaultDateRangeSetting(): Promise<DateRangeKey> {
  const value = await loadSetting(SETTING_KEYS.scoutDefaultDateRange);
  if (value && isValidDateRange(value)) {
    return value;
  }
  return DEFAULT_DATE_RANGE;
}

export async function saveDefaultDateRangeSetting(
  value: DateRangeKey
): Promise<void> {
  await saveSetting(SETTING_KEYS.scoutDefaultDateRange, value);
}
