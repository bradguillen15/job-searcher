import type { AiBackend } from "../backends/types";
import { buildBatchScorePrompt } from "../prompts";
import { parseBatchScores } from "../parse";
import {
  loadUnscoredJobs,
  updateJobScore,
} from "../matcher-db";
import { BATCH_SIZE } from "../types";
import type { ProgressEmitter } from "../../scraper/types";

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

export async function runBatchScorePhase(
  backend: AiBackend,
  runId: number,
  skillProfile: string,
  emit: ProgressEmitter
): Promise<{ scored: number }> {
  const jobs = loadUnscoredJobs(runId);
  const batches = chunk(jobs, BATCH_SIZE);
  const totalBatches = batches.length;

  emit({
    type: "matching_phase",
    timestamp: new Date().toISOString(),
    phase: 2,
    status: "start",
    detail: `${jobs.length} jobs`,
  });

  let scored = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]!;
    const batchNum = i + 1;
    const jobIds = batch.map((job) => job.id);

    emit({
      type: "matching_batch",
      timestamp: new Date().toISOString(),
      batch: batchNum,
      totalBatches,
      jobCount: batch.length,
    });

    const { system, user } = buildBatchScorePrompt(skillProfile, batch);

    try {
      const raw = await backend.complete(system, user, { json: true });
      const { scores, parseFailed } = parseBatchScores(raw, jobIds);

      if (parseFailed) {
        emit({
          type: "log",
          timestamp: new Date().toISOString(),
          message: `Batch ${batchNum}: failed to parse score response`,
        });
      }

      for (const jobId of jobIds) {
        updateJobScore(jobId, scores.get(jobId) ?? 0);
        scored++;
      }
    } catch (err) {
      const message = (err as Error).message;
      emit({
        type: "log",
        timestamp: new Date().toISOString(),
        message: `Batch ${batchNum} scoring failed: ${message}`,
      });

      for (const jobId of jobIds) {
        updateJobScore(jobId, 0);
        scored++;
      }
    }
  }

  emit({
    type: "matching_phase",
    timestamp: new Date().toISOString(),
    phase: 2,
    status: "complete",
    detail: `${scored} scored`,
  });

  return { scored };
}
