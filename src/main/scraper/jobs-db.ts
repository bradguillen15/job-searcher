import { db } from "../db";
import type { BoardRow, KeywordRow } from "./types";

export function createRun(): number {
  const startedAt = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO runs (started_at, finished_at, total_scraped, total_new)
       VALUES (?, NULL, 0, 0)`
    )
    .run(startedAt);
  return Number(result.lastInsertRowid);
}

export function finishRun(
  runId: number,
  totals: { totalScraped: number; totalNew: number }
): void {
  const finishedAt = new Date().toISOString();
  db.prepare(
    `UPDATE runs
     SET finished_at = ?, total_scraped = ?, total_new = ?
     WHERE id = ?`
  ).run(finishedAt, totals.totalScraped, totals.totalNew, runId);
}

export function loadBoards(): BoardRow[] {
  return db
    .prepare(
      `SELECT id, name, url, search_selector FROM boards ORDER BY id`
    )
    .all() as BoardRow[];
}

export function loadActiveKeywords(): KeywordRow[] {
  return db
    .prepare(`SELECT id, keyword, active FROM keywords WHERE active = 1 ORDER BY id`)
    .all() as KeywordRow[];
}

export function updateBoardSearchSelector(boardId: number, selector: string): void {
  db.prepare(`UPDATE boards SET search_selector = ? WHERE id = ?`).run(
    selector,
    boardId
  );
}

export function urlExists(sanitizedUrl: string): boolean {
  const row = db
    .prepare(`SELECT 1 AS found FROM jobs WHERE url = ?`)
    .get(sanitizedUrl) as { found: number } | undefined;
  return row !== undefined;
}

export function insertJob(input: {
  boardId: number;
  keywordId: number;
  runId: number;
  title: string;
  company: string | null;
  location: string | null;
  postedDate: string | null;
  description: string | null;
  url: string;
}): "inserted" | "skipped" {
  if (urlExists(input.url)) {
    return "skipped";
  }

  const scrapedAt = new Date().toISOString();

  try {
    db.prepare(
      `INSERT INTO jobs (
        board_id, keyword_id, run_id, title, company, location,
        posted_date, description, url, score, match_reason, status, scraped_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, 'new', ?)`
    ).run(
      input.boardId,
      input.keywordId,
      input.runId,
      input.title,
      input.company,
      input.location,
      input.postedDate,
      input.description,
      input.url,
      scrapedAt
    );
    return "inserted";
  } catch (err) {
    const message = (err as Error).message;
    if (message.includes("UNIQUE constraint failed")) {
      return "skipped";
    }
    throw err;
  }
}
