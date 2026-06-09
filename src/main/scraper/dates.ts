import type { DateRangeKey } from "./types";

const HOURS_BY_RANGE: Record<DateRangeKey, number> = {
  "24h": 24,
  "7d": 168,
  "30d": 720,
  "60d": 1440,
  "90d": 2160,
};

export function dateRangeToCutoff(dateRange: DateRangeKey, now: Date = new Date()): Date {
  const hours = HOURS_BY_RANGE[dateRange];
  return new Date(now.getTime() - hours * 60 * 60 * 1000);
}

export function parsePostedDate(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const lower = trimmed.toLowerCase();
  const now = new Date();

  if (lower === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  if (lower === "yesterday") {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    );
  }

  const daysAgoMatch = lower.match(/^(\d+)\s+days?\s+ago$/);
  if (daysAgoMatch) {
    const days = Number(daysAgoMatch[1]);
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    return date;
  }

  const hoursAgoMatch = lower.match(/^(\d+)\s+hours?\s+ago$/);
  if (hoursAgoMatch) {
    const hours = Number(hoursAgoMatch[1]);
    return new Date(now.getTime() - hours * 60 * 60 * 1000);
  }

  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed);
  }

  return null;
}

export function isBeforeCutoff(postedDate: string | null, cutoff: Date): boolean {
  if (!postedDate) {
    return false;
  }
  const parsed = parsePostedDate(postedDate);
  if (!parsed) {
    return false;
  }
  return parsed.getTime() < cutoff.getTime();
}

export function shouldStopPagination(
  jobs: Array<{ postedDate: string | null }>,
  cutoff: Date
): boolean {
  for (const job of jobs) {
    if (!job.postedDate) {
      continue;
    }
    const parsed = parsePostedDate(job.postedDate);
    if (parsed && parsed.getTime() < cutoff.getTime()) {
      return true;
    }
  }
  return false;
}
