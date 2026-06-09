import type { Resume } from "@/types/resume";

export type DbQueryError = { error: string };

export class ResumeDbError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeDbError";
  }
}

const SELECT_RESUME_SQL = `
SELECT id, filename, raw_text, skill_profile, current_company,
  current_salary, target_salary, search_mode, updated_at
FROM resume ORDER BY updated_at DESC LIMIT 1
`;

function isDbQueryError(result: unknown): result is DbQueryError {
  return (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    typeof (result as DbQueryError).error === "string"
  );
}

async function dbQuery(sql: string, params: unknown[]): Promise<unknown> {
  const result = await window.api.invoke("db:query", { sql, params });
  if (isDbQueryError(result)) {
    throw new ResumeDbError(result.error || "Unable to load resume");
  }
  return result;
}

export async function getResume(): Promise<Resume | null> {
  const result = await dbQuery(SELECT_RESUME_SQL, []);
  const rows = result as Resume[];
  return rows[0] ?? null;
}
