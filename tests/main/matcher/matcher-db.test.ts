import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { db, openDatabase } from "../../../src/main/db.js";
import { createRun } from "../../../src/main/scraper/jobs-db.js";
import {
  countMatchedJobs,
  loadJobsForMatchReason,
  loadResume,
  loadUnscoredJobs,
  saveSkillProfile,
  updateJobMatchReason,
  updateJobScore,
} from "../../../src/main/matcher/matcher-db.js";

let keywordCounter = 0;

function seedJob(
  runId: number,
  score: number | null,
  title: string
): number {
  const boardId = Number(
    db.prepare("INSERT INTO boards (name, url) VALUES (?, ?)").run(
      "Board",
      `https://board.example.com/${title}`
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
        board_id, keyword_id, run_id, title, company, location,
        description, url, score, status, scraped_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', datetime('now'))`
    )
    .run(
      boardId,
      keywordId,
      runId,
      title,
      "Co",
      null,
      "desc",
      `https://jobs.example.com/${title}-${runId}`,
      score
    );

  return Number(result.lastInsertRowid);
}

describe("matcher-db", () => {
  beforeEach(() => {
    openDatabase(":memory:");
    keywordCounter = 0;
  });

  it("loadResume returns latest row by updated_at", () => {
    db.prepare(
      `INSERT INTO resume (filename, raw_text, updated_at)
       VALUES (?, ?, ?)`
    ).run("old.pdf", "old text", "2026-01-01T00:00:00.000Z");
    db.prepare(
      `INSERT INTO resume (filename, raw_text, updated_at)
       VALUES (?, ?, ?)`
    ).run("new.pdf", "new text", "2026-06-01T00:00:00.000Z");

    const resume = loadResume();
    assert.ok(resume);
    assert.equal(resume.raw_text, "new text");
  });

  it("saveSkillProfile persists to resume row", () => {
    const result = db
      .prepare("INSERT INTO resume (filename, raw_text) VALUES (?, ?)")
      .run("cv.pdf", "raw");
    const resumeId = Number(result.lastInsertRowid);

    saveSkillProfile(resumeId, "TypeScript, React");

    const row = db
      .prepare("SELECT skill_profile FROM resume WHERE id = ?")
      .get(resumeId) as { skill_profile: string };
    assert.equal(row.skill_profile, "TypeScript, React");
  });

  it("loadUnscoredJobs returns only null-score jobs for run", () => {
    const runId = createRun();
    seedJob(runId, null, "unscored");
    seedJob(runId, 50, "scored");

    const jobs = loadUnscoredJobs(runId);
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0]?.title, "unscored");
  });

  it("loadJobsForMatchReason orders by score desc then id asc", () => {
    const runId = createRun();
    const low = seedJob(runId, 70, "low");
    const high = seedJob(runId, 90, "high");
    seedJob(runId, 50, "below");

    const jobs = loadJobsForMatchReason(runId, 10);
    assert.equal(jobs.length, 2);
    assert.equal(jobs[0]?.id, high);
    assert.equal(jobs[1]?.id, low);
  });

  it("updateJobScore and updateJobMatchReason persist values", () => {
    const runId = createRun();
    const jobId = seedJob(runId, null, "job");

    updateJobScore(jobId, 85);
    updateJobMatchReason(jobId, "Strong fit");

    const row = db
      .prepare("SELECT score, match_reason FROM jobs WHERE id = ?")
      .get(jobId) as { score: number; match_reason: string };

    assert.equal(row.score, 85);
    assert.equal(row.match_reason, "Strong fit");
  });

  it("countMatchedJobs counts jobs at or above threshold", () => {
    const runId = createRun();
    seedJob(runId, 70, "match");
    seedJob(runId, 69, "no-match");
    seedJob(runId, 80, "match2");

    assert.equal(countMatchedJobs(runId, 70), 2);
  });
});
