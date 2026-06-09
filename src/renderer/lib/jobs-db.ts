import type {
  Activity,
  JobStatus,
  JobWithMeta,
  PipelineJobWithMeta,
} from "@/types/job";
import { isJobStatus, isPipelineStatus, PIPELINE_STATUSES } from "@/types/job";

export type DbQueryError = { error: string };

export class JobsDbError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JobsDbError";
  }
}

export const LIST_JOBS_SQL = `SELECT
  j.id,
  j.board_id,
  j.keyword_id,
  j.run_id,
  j.title,
  j.company,
  j.location,
  j.posted_date,
  j.description,
  j.url,
  j.score,
  j.match_reason,
  j.status,
  j.scraped_at,
  b.name AS board_name,
  k.keyword AS keyword_text
FROM jobs j
INNER JOIN boards b ON j.board_id = b.id
INNER JOIN keywords k ON j.keyword_id = k.id
ORDER BY j.score IS NULL, j.score DESC, j.scraped_at DESC`;

export const LIST_PIPELINE_JOBS_SQL = `SELECT
  j.id,
  j.board_id,
  j.keyword_id,
  j.run_id,
  j.title,
  j.company,
  j.location,
  j.posted_date,
  j.description,
  j.url,
  j.score,
  j.match_reason,
  j.status,
  j.scraped_at,
  b.name AS board_name,
  k.keyword AS keyword_text,
  la.last_activity_at
FROM jobs j
INNER JOIN boards b ON j.board_id = b.id
INNER JOIN keywords k ON j.keyword_id = k.id
LEFT JOIN (
  SELECT job_id, MAX(created_at) AS last_activity_at
  FROM activities
  GROUP BY job_id
) la ON la.job_id = j.id
WHERE j.status IN (?, ?, ?, ?, ?, ?)
ORDER BY j.status, la.last_activity_at IS NULL, la.last_activity_at DESC, j.title ASC`;

const LIST_ACTIVITIES_SQL = `SELECT id, job_id, type, notes, scheduled_at, created_at
FROM activities
WHERE job_id = ?
ORDER BY created_at DESC`;

const INSERT_ACTIVITY_SQL =
  "INSERT INTO activities (job_id, type, notes) VALUES (?, ?, ?)";

const SELECT_ACTIVITY_BY_ID_SQL = `SELECT id, job_id, type, notes, scheduled_at, created_at
FROM activities WHERE id = ?`;

const UPDATE_STATUS_SQL = "UPDATE jobs SET status = ? WHERE id = ?";

type WriteResult = { changes: number; lastInsertRowid: number };

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
    throw new JobsDbError(result.error || "Database error");
  }
  return result;
}

function mapJobRow(row: Record<string, unknown>): JobWithMeta {
  const rawStatus = String(row.status ?? "new");
  const status: JobStatus = isJobStatus(rawStatus) ? rawStatus : "new";

  return {
    id: Number(row.id),
    board_id: Number(row.board_id),
    keyword_id: Number(row.keyword_id),
    run_id: Number(row.run_id),
    title: String(row.title),
    company: row.company != null ? String(row.company) : null,
    location: row.location != null ? String(row.location) : null,
    posted_date: row.posted_date != null ? String(row.posted_date) : null,
    description: row.description != null ? String(row.description) : null,
    url: String(row.url),
    score: row.score != null ? Number(row.score) : null,
    match_reason:
      row.match_reason != null ? String(row.match_reason) : null,
    status,
    scraped_at: String(row.scraped_at),
    board_name: String(row.board_name),
    keyword_text: String(row.keyword_text),
  };
}

export async function listJobsWithMeta(): Promise<JobWithMeta[]> {
  const result = await dbQuery(LIST_JOBS_SQL, []);
  return (result as Record<string, unknown>[]).map(mapJobRow);
}

function mapPipelineJobRow(row: Record<string, unknown>): PipelineJobWithMeta | null {
  const job = mapJobRow(row);
  if (!isPipelineStatus(job.status)) {
    return null;
  }
  return {
    ...job,
    last_activity_at:
      row.last_activity_at != null ? String(row.last_activity_at) : null,
  };
}

export async function listPipelineJobsWithMeta(): Promise<PipelineJobWithMeta[]> {
  const result = await dbQuery(LIST_PIPELINE_JOBS_SQL, [
    ...PIPELINE_STATUSES,
  ]);
  return (result as Record<string, unknown>[])
    .map(mapPipelineJobRow)
    .filter((job): job is PipelineJobWithMeta => job !== null);
}

export async function listActivities(jobId: number): Promise<Activity[]> {
  const result = await dbQuery(LIST_ACTIVITIES_SQL, [jobId]);
  return result as Activity[];
}

export async function addActivity(input: {
  jobId: number;
  type: "note" | "status_change";
  notes: string;
}): Promise<Activity> {
  const writeResult = (await dbQuery(INSERT_ACTIVITY_SQL, [
    input.jobId,
    input.type,
    input.notes,
  ])) as WriteResult;

  const rows = (await dbQuery(SELECT_ACTIVITY_BY_ID_SQL, [
    writeResult.lastInsertRowid,
  ])) as Activity[];

  const activity = rows[0];
  if (!activity) {
    throw new JobsDbError("Failed to load created activity");
  }
  return activity;
}

export async function updateJobStatus(
  jobId: number,
  status: JobStatus
): Promise<void> {
  await dbQuery(UPDATE_STATUS_SQL, [status, jobId]);
}
