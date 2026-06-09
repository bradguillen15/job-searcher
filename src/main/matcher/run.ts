import { createAiBackend } from "./backends/factory";
import type { FetchFn } from "./backends/ollama";
import { countMatchedJobs } from "./matcher-db";
import { runBatchScorePhase } from "./phases/batch-score";
import { runMatchReasonPhase } from "./phases/match-reason";
import { runSkillProfilePhase } from "./phases/skill-profile";
import { loadAiConfig } from "./settings";
import type { MatchingResult } from "./types";
import { MATCH_REASON_THRESHOLD } from "./types";
import type { ProgressEmitter } from "../scraper/types";

export interface RunMatchingDeps {
  backendFactory?: typeof createAiBackend;
  fetchFn?: FetchFn;
}

export async function runMatching(
  runId: number,
  emit: ProgressEmitter,
  deps?: RunMatchingDeps
): Promise<MatchingResult> {
  emit({
    type: "matching_start",
    timestamp: new Date().toISOString(),
    runId,
  });

  const config = loadAiConfig();
  const factory = deps?.backendFactory ?? createAiBackend;
  const backend = factory(config, deps?.fetchFn);

  const phase1 = await runSkillProfilePhase(backend, emit);
  if ("error" in phase1) {
    emit({
      type: "matching_complete",
      timestamp: new Date().toISOString(),
      runId,
      totalMatched: 0,
    });
    return {
      totalMatched: 0,
      skipped: true,
      skipReason: phase1.error,
    };
  }

  await runBatchScorePhase(backend, runId, phase1.profile, emit);
  await runMatchReasonPhase(backend, runId, phase1.profile, emit);

  const totalMatched = countMatchedJobs(runId, MATCH_REASON_THRESHOLD);

  emit({
    type: "matching_complete",
    timestamp: new Date().toISOString(),
    runId,
    totalMatched,
  });

  return { totalMatched, skipped: false };
}
