import {
  DATE_RANGE_OPTIONS,
  type DateRangeKey,
} from "@/types/scout";

export const SCOUT_DEFAULT_DATE_RANGE_KEY = "scout.default_date_range";

const DEFAULT_DATE_RANGE: DateRangeKey = "30d";

const SETTING_SQL = "SELECT value FROM settings WHERE key = ?";

function isDbQueryError(
  result: unknown
): result is { error: string } {
  return (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    typeof (result as { error: string }).error === "string"
  );
}

function isValidDateRange(value: string): value is DateRangeKey {
  return (DATE_RANGE_OPTIONS as readonly string[]).includes(value);
}

export async function loadDefaultDateRange(): Promise<DateRangeKey> {
  const result = await window.api.invoke("db:query", {
    sql: SETTING_SQL,
    params: [SCOUT_DEFAULT_DATE_RANGE_KEY],
  });

  if (isDbQueryError(result)) {
    throw new Error(result.error);
  }

  const rows = result as Array<{ value: string }>;
  const value = rows[0]?.value;
  if (value && isValidDateRange(value)) {
    return value;
  }
  return DEFAULT_DATE_RANGE;
}
