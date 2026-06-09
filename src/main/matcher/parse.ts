export function isValidProfileText(text: string): boolean {
  return text.trim().length > 0;
}

function clampScore(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(num)));
}

export interface BatchScoreParseResult {
  scores: Map<number, number>;
  parseFailed: boolean;
}

export function parseBatchScores(
  raw: string,
  jobIds: number[]
): BatchScoreParseResult {
  const scores = new Map<number, number>();
  for (const id of jobIds) {
    scores.set(id, 0);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { scores, parseFailed: true };
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as { scores?: unknown }).scores)
  ) {
    return { scores, parseFailed: true };
  }

  const entries = (parsed as { scores: Array<{ id?: unknown; score?: unknown }> })
    .scores;

  if (entries.length !== jobIds.length) {
    return { scores, parseFailed: true };
  }

  for (const entry of entries) {
    const id = typeof entry.id === "number" ? entry.id : Number(entry.id);
    if (!jobIds.includes(id)) {
      return { scores, parseFailed: true };
    }
    scores.set(id, clampScore(entry.score));
  }

  return { scores, parseFailed: false };
}
