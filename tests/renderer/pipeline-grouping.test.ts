import { describe, it, expect } from "vitest";
import {
  groupPipelineJobs,
  sortJobsInColumn,
} from "../../src/renderer/lib/pipeline-grouping";
import type { PipelineJobWithMeta } from "../../src/renderer/types/job";

function makeJob(
  overrides: Partial<PipelineJobWithMeta> & Pick<PipelineJobWithMeta, "id" | "status" | "title">
): PipelineJobWithMeta {
  return {
    board_id: 1,
    keyword_id: 1,
    run_id: 1,
    company: "Acme",
    location: null,
    posted_date: null,
    description: null,
    url: "https://example.com/job",
    score: 80,
    match_reason: null,
    scraped_at: "2026-06-08T12:00:00.000Z",
    board_name: "Indeed",
    keyword_text: "react",
    last_activity_at: null,
    ...overrides,
  };
}

describe("pipeline-grouping", () => {
  describe("sortJobsInColumn", () => {
    it("orders dated jobs by last_activity_at descending with nulls last", () => {
      const jobs = [
        makeJob({
          id: 1,
          title: "Zebra",
          status: "applying",
          last_activity_at: "2026-06-01T00:00:00.000Z",
        }),
        makeJob({
          id: 2,
          title: "Alpha",
          status: "applying",
          last_activity_at: null,
        }),
        makeJob({
          id: 3,
          title: "Beta",
          status: "applying",
          last_activity_at: "2026-06-08T00:00:00.000Z",
        }),
        makeJob({
          id: 4,
          title: "Gamma",
          status: "applying",
          last_activity_at: "2026-06-05T00:00:00.000Z",
        }),
      ];

      const sorted = sortJobsInColumn(jobs);

      expect(sorted.map((j) => j.id)).toEqual([3, 4, 1, 2]);
    });

    it("sorts null-activity jobs by title ascending", () => {
      const jobs = [
        makeJob({ id: 1, title: "Zulu", status: "applied", last_activity_at: null }),
        makeJob({ id: 2, title: "Alpha", status: "applied", last_activity_at: null }),
        makeJob({ id: 3, title: "Mike", status: "applied", last_activity_at: null }),
      ];

      const sorted = sortJobsInColumn(jobs);

      expect(sorted.map((j) => j.title)).toEqual(["Alpha", "Mike", "Zulu"]);
    });
  });

  describe("groupPipelineJobs", () => {
    it("places each job in the column matching its status", () => {
      const jobs = [
        makeJob({ id: 1, title: "A", status: "applying" }),
        makeJob({ id: 2, title: "B", status: "applied" }),
        makeJob({ id: 3, title: "C", status: "interviewing" }),
      ];

      const grouped = groupPipelineJobs(jobs);

      expect(grouped.applying.map((j) => j.id)).toEqual([1]);
      expect(grouped.applied.map((j) => j.id)).toEqual([2]);
      expect(grouped.interviewing.map((j) => j.id)).toEqual([3]);
      expect(grouped.offer).toHaveLength(0);
      expect(grouped.accepted).toHaveLength(0);
      expect(grouped.rejected).toHaveLength(0);
    });

    it("sorts jobs within each column by last activity", () => {
      const jobs = [
        makeJob({
          id: 1,
          title: "Old",
          status: "applying",
          last_activity_at: "2026-06-01T00:00:00.000Z",
        }),
        makeJob({
          id: 2,
          title: "New",
          status: "applying",
          last_activity_at: "2026-06-08T00:00:00.000Z",
        }),
      ];

      const grouped = groupPipelineJobs(jobs);

      expect(grouped.applying.map((j) => j.id)).toEqual([2, 1]);
    });
  });
});
