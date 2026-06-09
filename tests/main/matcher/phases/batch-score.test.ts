import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { db, openDatabase } from "../../../../src/main/db.js";
import type { AiBackend } from "../../../../src/main/matcher/backends/types.js";
import { runBatchScorePhase } from "../../../../src/main/matcher/phases/batch-score.js";
import { createRun } from "../../../../src/main/scraper/jobs-db.js";
import type { ProgressEvent } from "../../../../src/main/scraper/types.js";

let keywordCounter = 0;

function insertJob(runId: number, title: string): void {
  const boardId = Number(
    db.prepare("INSERT INTO boards (name, url) VALUES (?, ?)").run(
      "B",
      `https://b.example.com/${title}`
    ).lastInsertRowid
  );
  keywordCounter += 1;
  const keywordId = Number(
    db
      .prepare("INSERT INTO keywords (keyword) VALUES (?)")
      .run(`dev-${keywordCounter}`).lastInsertRowid
  );

  db.prepare(
    `INSERT INTO jobs (
      board_id, keyword_id, run_id, title, url, status, scraped_at
    ) VALUES (?, ?, ?, ?, ?, 'new', datetime('now'))`
  ).run(
    boardId,
    keywordId,
    runId,
    title,
    `https://jobs.example.com/${title}-${runId}`
  );
}

describe("batch-score phase", () => {
  const events: ProgressEvent[] = [];
  const emit = (event: ProgressEvent) => {
    events.push(event);
  };

  beforeEach(() => {
    openDatabase(":memory:");
    events.length = 0;
    keywordCounter = 0;
  });

  it("scores jobs in batches of five", async () => {
    const runId = createRun();
    for (let i = 0; i < 6; i++) {
      insertJob(runId, `job-${i}`);
    }

    let callCount = 0;
    const backend: AiBackend = {
      name: "ollama",
      complete: async (_system: string, user: string) => {
        callCount++;
        const payload = JSON.parse(user) as {
          jobs: Array<{ id: number }>;
        };
        return JSON.stringify({
          scores: payload.jobs.map((job) => ({ id: job.id, score: 60 + callCount })),
        });
      },
    };

    const result = await runBatchScorePhase(backend, runId, "profile", emit);

    assert.equal(callCount, 2);
    assert.equal(result.scored, 6);
    assert.ok(events.some((e) => e.type === "matching_batch"));
  });

  it("assigns zero on parse failure", async () => {
    const runId = createRun();
    insertJob(runId, "job-a");

    const backend: AiBackend = {
      name: "ollama",
      complete: async () => "not json",
    };

    await runBatchScorePhase(backend, runId, "profile", emit);

    const row = db
      .prepare("SELECT score FROM jobs WHERE run_id = ?")
      .get(runId) as { score: number };
    assert.equal(row.score, 0);
    assert.ok(events.some((e) => e.type === "log"));
  });

  it("assigns zero when backend throws", async () => {
    const runId = createRun();
    insertJob(runId, "job-b");

    const backend: AiBackend = {
      name: "ollama",
      complete: async () => {
        throw new Error("HTTP 503");
      },
    };

    await runBatchScorePhase(backend, runId, "profile", emit);

    const row = db
      .prepare("SELECT score FROM jobs WHERE run_id = ?")
      .get(runId) as { score: number };
    assert.equal(row.score, 0);
  });
});
