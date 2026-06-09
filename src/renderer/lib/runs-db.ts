import type { CompletedRun } from "@/types/scout";

export type RunsDbError = { error: string };

export class RunsDbErrorClass extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RunsDbError";
  }
}

const LAST_COMPLETED_RUN_SQL = `
SELECT id, started_at, finished_at, total_scraped, total_new, total_matched
FROM runs
WHERE finished_at IS NOT NULL
ORDER BY finished_at DESC
LIMIT 1
`.trim();

function isDbQueryError(result: unknown): result is RunsDbError {
  return (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    typeof (result as RunsDbError).error === "string"
  );
}

export async function getLastCompletedRun(): Promise<CompletedRun | null> {
  const result = await window.api.invoke("db:query", {
    sql: LAST_COMPLETED_RUN_SQL,
    params: [],
  });

  if (isDbQueryError(result)) {
    throw new RunsDbErrorClass(result.error);
  }

  const rows = result as CompletedRun[];
  return rows[0] ?? null;
}

export { LAST_COMPLETED_RUN_SQL };
