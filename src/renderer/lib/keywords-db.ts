import type { Keyword } from "@/types/keyword";

export type DbQueryError = { error: string };

export class KeywordsDbError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KeywordsDbError";
  }
}

const LIST_SQL =
  "SELECT id, keyword, active, created_at FROM keywords ORDER BY keyword ASC";

const INSERT_SQL = "INSERT INTO keywords (keyword, active) VALUES (?, 1)";

const UPDATE_ACTIVE_SQL = "UPDATE keywords SET active = ? WHERE id = ?";

const DELETE_SQL = "DELETE FROM keywords WHERE id = ?";

const SELECT_BY_ID_SQL =
  "SELECT id, keyword, active, created_at FROM keywords WHERE id = ?";

type WriteResult = { changes: number; lastInsertRowid: number };

function isDbQueryError(result: unknown): result is DbQueryError {
  return (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    typeof (result as DbQueryError).error === "string"
  );
}

export function mapDbError(error: string): string {
  if (error.includes("UNIQUE constraint failed: keywords.keyword")) {
    return "A keyword with this text already exists.";
  }
  if (error.includes("FOREIGN KEY constraint failed")) {
    return "Cannot delete this keyword while jobs reference it.";
  }
  return error || "Database error";
}

async function dbQuery(sql: string, params: unknown[]): Promise<unknown> {
  const result = await window.api.invoke("db:query", { sql, params });
  if (isDbQueryError(result)) {
    throw new KeywordsDbError(mapDbError(result.error));
  }
  return result;
}

export async function listKeywords(): Promise<Keyword[]> {
  const result = await dbQuery(LIST_SQL, []);
  return result as Keyword[];
}

export async function createKeyword(input: {
  keyword: string;
}): Promise<Keyword> {
  const trimmed = input.keyword.trim();
  const writeResult = (await dbQuery(INSERT_SQL, [trimmed])) as WriteResult;

  const rows = (await dbQuery(SELECT_BY_ID_SQL, [
    writeResult.lastInsertRowid,
  ])) as Keyword[];

  const keyword = rows[0];
  if (!keyword) {
    throw new KeywordsDbError("Failed to load created keyword");
  }
  return keyword;
}

export async function setKeywordActive(
  id: number,
  active: boolean
): Promise<void> {
  await dbQuery(UPDATE_ACTIVE_SQL, [active ? 1 : 0, id]);
}

export async function deleteKeyword(id: number): Promise<void> {
  await dbQuery(DELETE_SQL, [id]);
}
