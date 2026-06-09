import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { db, openDatabase } from "../../../src/main/db.js";
import type { AiBackend } from "../../../src/main/matcher/backends/types.js";
import { runMatching } from "../../../src/main/matcher/run.js";
import { createRun, insertJob } from "../../../src/main/scraper/jobs-db.js";
import type { ProgressEvent } from "../../../src/main/scraper/types.js";
import type { AiConfig } from "../../../src/main/matcher/types.js";

function seedBoardAndKeyword(): { boardId: number; keywordId: number } {
  const boardId = Number(
    db.prepare("INSERT INTO boards (name, url) VALUES (?, ?)").run(
      "B",
      "https://board.example.com"
    ).lastInsertRowid
  );
  const keywordId = Number(
    db.prepare("INSERT INTO keywords (keyword) VALUES (?)").run("dev").lastInsertRowid
  );
  return { boardId, keywordId };
}

describe("runMatching orchestrator", () => {
  const events: ProgressEvent[] = [];
  const emit = (event: ProgressEvent) => {
    events.push(event);
  };

  beforeEach(() => {
    openDatabase(":memory:");
    events.length = 0;
  });

  it("skips matching when no resume exists", async () => {
    const runId = createRun();

    const result = await runMatching(runId, emit, {
      backendFactory: () => ({
        name: "ollama",
        complete: async () => "should not run",
      }),
    });

    assert.equal(result.totalMatched, 0);
    assert.equal(result.skipped, true);
    assert.ok(events.some((e) => e.type === "matching_start"));
    assert.ok(events.some((e) => e.type === "matching_complete"));
    assert.ok(events.some((e) => e.type === "log"));
  });

  it("skips phases 2 and 3 when phase 1 fails", async () => {
    const runId = createRun();
    db.prepare("INSERT INTO resume (filename, raw_text) VALUES (?, ?)").run(
      "cv.pdf",
      "text"
    );
    const { boardId, keywordId } = seedBoardAndKeyword();

    insertJob({
      boardId,
      keywordId,
      runId,
      title: "Engineer",
      company: "Co",
      location: null,
      postedDate: null,
      description: "Build apps",
      url: "https://jobs.example.com/phase1-fail",
    });

    const result = await runMatching(runId, emit, {
      backendFactory: (_config: AiConfig) => ({
        name: "ollama",
        complete: async () => "",
      }),
    });

    assert.equal(result.skipped, true);
    assert.equal(result.totalMatched, 0);
    assert.ok(events.some((e) => e.type === "matching_complete"));
    assert.equal(
      events.some((e) => e.type === "matching_batch"),
      false
    );

    const job = db
      .prepare("SELECT score, match_reason FROM jobs WHERE run_id = ?")
      .get(runId) as { score: number | null; match_reason: string | null };
    assert.equal(job.score, null);
    assert.equal(job.match_reason, null);
  });

  it("runs happy path scoring and match reasons", async () => {
    const runId = createRun();
    db.prepare("INSERT INTO resume (filename, raw_text) VALUES (?, ?)").run(
      "cv.pdf",
      "TypeScript engineer"
    );
    const { boardId, keywordId } = seedBoardAndKeyword();

    insertJob({
      boardId,
      keywordId,
      runId,
      title: "Senior TS",
      company: "Co",
      location: null,
      postedDate: null,
      description: "Build apps",
      url: "https://jobs.example.com/1",
    });
    insertJob({
      boardId,
      keywordId,
      runId,
      title: "Junior",
      company: "Co",
      location: null,
      postedDate: null,
      description: "Learn",
      url: "https://jobs.example.com/2",
    });

    const jobs = db
      .prepare("SELECT id FROM jobs WHERE run_id = ? ORDER BY id")
      .all(runId) as Array<{ id: number }>;

    const backend: AiBackend = {
      name: "ollama",
      complete: async (_system, user, options) => {
        if (options?.json) {
          const payload = JSON.parse(user) as {
            jobs: Array<{ id: number }>;
          };
          return JSON.stringify({
            scores: payload.jobs.map((job) => ({
              id: job.id,
              score: job.id === jobs[0]?.id ? 85 : 40,
            })),
          });
        }

        try {
          const payload = JSON.parse(user) as { job?: { id: number } };
          if (payload.job) {
            return "Great TypeScript fit.";
          }
        } catch {
          return "- TypeScript\n- React";
        }

        return "- TypeScript\n- React";
      },
    };

    const result = await runMatching(runId, emit, {
      backendFactory: () => backend,
    });

    assert.equal(result.totalMatched, 1);
    assert.equal(result.skipped, false);

    const matched = db
      .prepare("SELECT score, match_reason FROM jobs WHERE id = ?")
      .get(jobs[0]!.id) as { score: number; match_reason: string };
    assert.equal(matched.score, 85);
    assert.equal(matched.match_reason, "Great TypeScript fit.");
  });
});
