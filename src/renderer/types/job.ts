export type JobStatus =
  | "new"
  | "applying"
  | "applied"
  | "interviewing"
  | "offer"
  | "accepted"
  | "rejected";

export const JOB_STATUSES: readonly JobStatus[] = [
  "new",
  "applying",
  "applied",
  "interviewing",
  "offer",
  "accepted",
  "rejected",
];

export type StatusTabKey = "all" | JobStatus;

export interface JobWithMeta {
  id: number;
  board_id: number;
  keyword_id: number;
  run_id: number;
  title: string;
  company: string | null;
  location: string | null;
  posted_date: string | null;
  description: string | null;
  url: string;
  score: number | null;
  match_reason: string | null;
  status: JobStatus;
  scraped_at: string;
  board_name: string;
  keyword_text: string;
}

export interface Activity {
  id: number;
  job_id: number;
  type: string;
  notes: string | null;
  scheduled_at: string | null;
  created_at: string;
}

export type ScoreTier = "high" | "medium" | "low" | "none";

export function getScoreTier(score: number | null): ScoreTier {
  if (score === null) {
    return "none";
  }
  if (score >= 75) {
    return "high";
  }
  if (score >= 50) {
    return "medium";
  }
  return "low";
}

export function scoreBadgeClassName(tier: ScoreTier): string {
  switch (tier) {
    case "high":
      return "bg-emerald-600/20 text-emerald-400 border-emerald-600/40";
    case "medium":
      return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    case "low":
      return "bg-red-500/20 text-red-400 border-red-500/40";
    case "none":
      return "bg-muted text-muted-foreground";
  }
}

export function truncateDescription(
  text: string | null,
  maxLen = 400
): string {
  if (!text) {
    return "";
  }
  if (text.length <= maxLen) {
    return text;
  }
  return `${text.slice(0, maxLen)}…`;
}

export function formatStatusLabel(status: JobStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function isJobStatus(value: string): value is JobStatus {
  return (JOB_STATUSES as readonly string[]).includes(value);
}
