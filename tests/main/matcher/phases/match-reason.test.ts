import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { db, openDatabase } from "../../../../src/main/db.js";
import type { AiBackend } from "../../../../src/main/matcher/backends/types.js";
import { runMatchReasonPhase } from "../../../../src/main/matcher/phases/match-reason.js";
import { createRun } from "../../../../src/main/scraper/jobs-db.js";
import type { ProgressEvent } from "../../../../src/main/scraper/types.js";

let keywordCounter = 0;

function insertScoredJob(
  runId: number,
  score: number,
  title: string
): number {
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

  const result = db
    .prepare(
      `INSERT INTO jobs (
        board_id, keyword_id, run_id, title, url, score, status, scraped_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'new', datetime('now'))`
    )
    .run(
      boardId,
      keywordId,
      runId,
      title,
      `https://jobs.example.com/${title}-${runId}`,
      score
    );

  return Number(result.lastInsertRowid);
}

describe("match-reason phase", () => {
  const events: ProgressEvent[] = [];
  const emit = (event: ProgressEvent) => {
    events.push(event);
  };

  beforeEach(() => {
    openDatabase(":memory:");
    events.length = 0;
    keywordCounter = 0;
  });

  it("generates reasons for jobs scoring at or above 70", async () => {
    const runId = createRun();
    insertScoredJob(runId, 85, "high");
    insertScoredJob(runId, 50, "low");

    const backend: AiBackend = {
      name: "ollama",
      complete: async () => "Strong TypeScript alignment.",
    };

    const result = await runMatchReasonPhase(backend, runId, "profile", emit);

    assert.equal(result.reasonsGenerated, 1);

    const high = db
      .prepare("SELECT match_reason FROM jobs WHERE title = ?")
      .get("high") as { match_reason: string };
    const low = db
      .prepare("SELECT match_reason FROM jobs WHERE title = ?")
      .get("low") as { match_reason: string | null };

    assert.equal(high.match_reason, "Strong TypeScript alignment.");
    assert.equal(low.match_reason, null);
  });

  it("caps Phase 3 calls at ten jobs", async () => {
    const runId = createRun();
    for (let i = 0; i < 12; i++) {
      insertScoredJob(runId, 80 + i, `job-${i}`);
    }

    let calls = 0;
    const backend: AiBackend = {
      name: "ollama",
      complete: async () => {
        calls++;
        return "reason";
      },
    };

    await runMatchReasonPhase(backend, runId, "profile", emit);

    assert.equal(calls, 10);
  });

  it("orders by score desc then id asc", async () => {
    const runId = createRun();
    const first = insertScoredJob(runId, 90, "a");
    insertScoredJob(runId, 90, "b");
    insertScoredJob(runId, 70, "c");

    const attempted: number[] = [];
    const backend: AiBackend = {
      name: "ollama",
      complete: async (_system: string, user: string) => {
        const payload = JSON.parse(user) as { job: { id: number } };
        attempted.push(payload.job.id);
        return "reason";
      },
    };

    await runMatchReasonPhase(backend, runId, "profile", emit);

    assert.equal(attempted[0], first);
  });

  it("leaves match_reason null when backend fails", async () => {
    const runId = createRun();
    const jobId = insertScoredJob(runId, 75, "fail-job");

    const backend: AiBackend = {
      name: "ollama",
      complete: async () => {
        throw new Error("timeout");
      },
    };

    await runMatchReasonPhase(backend, runId, "profile", emit);

    const row = db
      .prepare("SELECT match_reason FROM jobs WHERE id = ?")
      .get(jobId) as { match_reason: string | null };
    assert.equal(row.match_reason, null);
    assert.ok(events.some((e) => e.type === "log"));
  });
});
