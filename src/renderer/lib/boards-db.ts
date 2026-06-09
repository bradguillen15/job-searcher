import type { Board } from "@/types/board";

export type DbQueryError = { error: string };

export class BoardsDbError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BoardsDbError";
  }
}

const LIST_SQL =
  "SELECT id, name, url, search_selector, created_at FROM boards ORDER BY name ASC";

const INSERT_SQL =
  "INSERT INTO boards (name, url, search_selector) VALUES (?, ?, ?)";

const UPDATE_SQL =
  "UPDATE boards SET name = ?, url = ?, search_selector = ? WHERE id = ?";

const DELETE_SQL = "DELETE FROM boards WHERE id = ?";

const SELECT_BY_ID_SQL =
  "SELECT id, name, url, search_selector, created_at FROM boards WHERE id = ?";

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
  if (error.includes("UNIQUE constraint failed: boards.url")) {
    return "A board with this URL already exists.";
  }
  if (error.includes("FOREIGN KEY constraint failed")) {
    return "Cannot delete this board while jobs reference it.";
  }
  return error || "Database error";
}

export function normalizeSearchSelector(
  value: string | null | undefined
): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

async function dbQuery(sql: string, params: unknown[]): Promise<unknown> {
  const result = await window.api.invoke("db:query", { sql, params });
  if (isDbQueryError(result)) {
    throw new BoardsDbError(mapDbError(result.error));
  }
  return result;
}

export async function listBoards(): Promise<Board[]> {
  const result = await dbQuery(LIST_SQL, []);
  return result as Board[];
}

export async function createBoard(input: {
  name: string;
  url: string;
  searchSelector: string | null;
}): Promise<Board> {
  const selectorOrNull = normalizeSearchSelector(input.searchSelector);
  const writeResult = (await dbQuery(INSERT_SQL, [
    input.name.trim(),
    input.url.trim(),
    selectorOrNull,
  ])) as WriteResult;

  const rows = (await dbQuery(SELECT_BY_ID_SQL, [
    writeResult.lastInsertRowid,
  ])) as Board[];

  const board = rows[0];
  if (!board) {
    throw new BoardsDbError("Failed to load created board");
  }
  return board;
}

export async function updateBoard(
  id: number,
  input: { name: string; url: string; searchSelector: string | null }
): Promise<void> {
  const selectorOrNull = normalizeSearchSelector(input.searchSelector);
  await dbQuery(UPDATE_SQL, [
    input.name.trim(),
    input.url.trim(),
    selectorOrNull,
    id,
  ]);
}

export async function deleteBoard(id: number): Promise<void> {
  await dbQuery(DELETE_SQL, [id]);
}
