import type { AiBackend } from "../backends/types";
import { buildMatchReasonPrompt } from "../prompts";
import {
  loadJobsForMatchReason,
  updateJobMatchReason,
} from "../matcher-db";
import { MAX_MATCH_REASON_CALLS } from "../types";
import type { ProgressEmitter } from "../../scraper/types";

export async function runMatchReasonPhase(
  backend: AiBackend,
  runId: number,
  skillProfile: string,
  emit: ProgressEmitter
): Promise<{ reasonsGenerated: number }> {
  const jobs = loadJobsForMatchReason(runId, MAX_MATCH_REASON_CALLS);

  emit({
    type: "matching_phase",
    timestamp: new Date().toISOString(),
    phase: 3,
    status: "start",
    detail: `${jobs.length} jobs`,
  });

  let reasonsGenerated = 0;

  for (const job of jobs) {
    emit({
      type: "matching_phase",
      timestamp: new Date().toISOString(),
      phase: 3,
      status: "processing",
      detail: `job ${job.id}`,
    });

    const { system, user } = buildMatchReasonPrompt(skillProfile, job);

    try {
      const raw = await backend.complete(system, user);
      const reason = raw.trim();

      if (!reason) {
        emit({
          type: "log",
          timestamp: new Date().toISOString(),
          message: `Match reason empty for job ${job.id}`,
        });
        continue;
      }

      updateJobMatchReason(job.id, reason);
      reasonsGenerated++;
    } catch (err) {
      emit({
        type: "log",
        timestamp: new Date().toISOString(),
        message: `Match reason failed for job ${job.id}: ${(err as Error).message}`,
      });
    }
  }

  emit({
    type: "matching_phase",
    timestamp: new Date().toISOString(),
    phase: 3,
    status: "complete",
    detail: `${reasonsGenerated} reasons`,
  });

  return { reasonsGenerated };
}
