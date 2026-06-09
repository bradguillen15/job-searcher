import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { db, openDatabase } from "../../../src/main/db.js";
import {
  createRun,
  finishRun,
  insertJob,
  loadActiveKeywords,
  loadBoards,
  updateBoardSearchSelector,
  urlExists,
} from "../../../src/main/scraper/jobs-db.js";

describe("jobs-db", () => {
  beforeEach(() => {
    openDatabase(":memory:");
  });

  it("createRun inserts row with NULL finished_at", () => {
    const runId = createRun();
    const run = db
      .prepare("SELECT started_at, finished_at FROM runs WHERE id = ?")
      .get(runId) as { started_at: string; finished_at: string | null };

    assert.ok(run.started_at.endsWith("Z"));
    assert.equal(run.finished_at, null);
  });

  it("finishRun sets finished_at and totals", () => {
    const runId = createRun();
    finishRun(runId, { totalScraped: 5, totalNew: 2 });

    const run = db
      .prepare(
        "SELECT finished_at, total_scraped, total_new FROM runs WHERE id = ?"
      )
      .get(runId) as {
      finished_at: string;
      total_scraped: number;
      total_new: number;
    };

    assert.ok(run.finished_at.endsWith("Z"));
    assert.equal(run.total_scraped, 5);
    assert.equal(run.total_new, 2);
  });

  it("loadActiveKeywords returns only active keywords", () => {
    db.prepare("INSERT INTO keywords (keyword, active) VALUES (?, ?)").run(
      "typescript",
      1
    );
    db.prepare("INSERT INTO keywords (keyword, active) VALUES (?, ?)").run(
      "rust",
      0
    );

    const keywords = loadActiveKeywords();
    assert.equal(keywords.length, 1);
    assert.equal(keywords[0]?.keyword, "typescript");
  });

  it("loadBoards returns all boards", () => {
    db.prepare("INSERT INTO boards (name, url) VALUES (?, ?)").run(
      "Indeed",
      "https://indeed.com"
    );

    const boards = loadBoards();
    assert.equal(boards.length, 1);
    assert.equal(boards[0]?.name, "Indeed");
  });

  it("updateBoardSearchSelector persists selector", () => {
    const result = db
      .prepare("INSERT INTO boards (name, url) VALUES (?, ?)")
      .run("Board", "https://board.example.com");
    const boardId = Number(result.lastInsertRowid);

    updateBoardSearchSelector(boardId, "#job-search");
    const row = db
      .prepare("SELECT search_selector FROM boards WHERE id = ?")
      .get(boardId) as { search_selector: string };

    assert.equal(row.search_selector, "#job-search");
  });

  it("insertJob sets status new with null score and match_reason", () => {
    const boardId = Number(
      db.prepare("INSERT INTO boards (name, url) VALUES (?, ?)").run(
        "B",
        "https://b.example.com"
      ).lastInsertRowid
    );
    const keywordId = Number(
      db.prepare("INSERT INTO keywords (keyword) VALUES (?)").run("dev").lastInsertRowid
    );
    const runId = createRun();

    const outcome = insertJob({
      boardId,
      keywordId,
      runId,
      title: "Engineer",
      company: "Co",
      location: null,
      postedDate: null,
      description: null,
      url: "https://b.example.com/jobs/1",
    });

    assert.equal(outcome, "inserted");

    const job = db
      .prepare(
        "SELECT status, score, match_reason, board_id, keyword_id, run_id FROM jobs WHERE url = ?"
      )
      .get("https://b.example.com/jobs/1") as {
      status: string;
      score: number | null;
      match_reason: string | null;
      board_id: number;
      keyword_id: number;
      run_id: number;
    };

    assert.equal(job.status, "new");
    assert.equal(job.score, null);
    assert.equal(job.match_reason, null);
    assert.equal(job.board_id, boardId);
    assert.equal(job.keyword_id, keywordId);
    assert.equal(job.run_id, runId);
  });

  it("insertJob skips duplicate URLs", () => {
    const boardId = Number(
      db.prepare("INSERT INTO boards (name, url) VALUES (?, ?)").run(
        "B",
        "https://b.example.com"
      ).lastInsertRowid
    );
    const keywordId = Number(
      db.prepare("INSERT INTO keywords (keyword) VALUES (?)").run("dev").lastInsertRowid
    );
    const runId = createRun();

    const url = "https://b.example.com/jobs/dup";
    insertJob({
      boardId,
      keywordId,
      runId,
      title: "First",
      company: null,
      location: null,
      postedDate: null,
      description: null,
      url,
    });

    assert.equal(urlExists(url), true);

    const second = insertJob({
      boardId,
      keywordId,
      runId,
      title: "Second",
      company: null,
      location: null,
      postedDate: null,
      description: null,
      url,
    });

    assert.equal(second, "skipped");
  });
});
