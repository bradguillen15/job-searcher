import { db } from "../db";
import type { JobForScoring, ResumeRow } from "./types";
import { MATCH_REASON_THRESHOLD } from "./types";

export function loadResume(): ResumeRow | null {
  const row = db
    .prepare(
      `SELECT id, raw_text, skill_profile
       FROM resume
       ORDER BY updated_at DESC
       LIMIT 1`
    )
    .get() as ResumeRow | undefined;

  return row ?? null;
}

export function saveSkillProfile(resumeId: number, text: string): void {
  db.prepare(`UPDATE resume SET skill_profile = ? WHERE id = ?`).run(
    text,
    resumeId
  );
}

export function loadUnscoredJobs(runId: number): JobForScoring[] {
  return db
    .prepare(
      `SELECT id, title, company, location, description
       FROM jobs
       WHERE run_id = ? AND score IS NULL
       ORDER BY id`
    )
    .all(runId) as JobForScoring[];
}

export function updateJobScore(jobId: number, score: number): void {
  db.prepare(`UPDATE jobs SET score = ? WHERE id = ?`).run(score, jobId);
}

export function loadJobsForMatchReason(
  runId: number,
  limit: number
): JobForScoring[] {
  return db
    .prepare(
      `SELECT id, title, company, location, description
       FROM jobs
       WHERE run_id = ? AND score >= ?
       ORDER BY score DESC, id ASC
       LIMIT ?`
    )
    .all(runId, MATCH_REASON_THRESHOLD, limit) as JobForScoring[];
}

export function updateJobMatchReason(jobId: number, reason: string): void {
  db.prepare(`UPDATE jobs SET match_reason = ? WHERE id = ?`).run(
    reason,
    jobId
  );
}

export function countMatchedJobs(runId: number, threshold: number): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM jobs
       WHERE run_id = ? AND score >= ?`
    )
    .get(runId, threshold) as { count: number };

  return row.count;
}
