import { describe, it, expect } from "vitest";
import { distinctKeywords, filterJobs } from "../../src/renderer/lib/results-filters";
import {
  getScoreTier,
  scoreBadgeClassName,
  truncateDescription,
} from "../../src/renderer/types/job";
import type { JobWithMeta } from "../../src/renderer/types/job";

function makeJob(overrides: Partial<JobWithMeta> & Pick<JobWithMeta, "id">): JobWithMeta {
  return {
    board_id: 1,
    keyword_id: 1,
    run_id: 1,
    title: `Job ${overrides.id}`,
    company: "Co",
    location: null,
    posted_date: null,
    description: null,
    url: "https://example.com",
    score: 50,
    match_reason: null,
    status: "new",
    scraped_at: "2026-06-08T12:00:00.000Z",
    board_name: "Board",
    keyword_text: "react",
    ...overrides,
  };
}

const jobs: JobWithMeta[] = [
  makeJob({ id: 1, score: 80, status: "new", keyword_text: "react" }),
  makeJob({ id: 2, score: 60, status: "applying", keyword_text: "typescript" }),
  makeJob({ id: 3, score: 40, status: "new", keyword_text: "react" }),
  makeJob({ id: 4, score: null, status: "rejected", keyword_text: "node" }),
];

describe("results-filters", () => {
  describe("distinctKeywords", () => {
    it("returns sorted unique keywords from jobs", () => {
      expect(distinctKeywords(jobs)).toEqual(["node", "react", "typescript"]);
    });
  });

  describe("filterJobs", () => {
    it("includes all jobs when status tab is all", () => {
      const result = filterJobs(jobs, {
        statusTab: "all",
        scoreThreshold: 0,
        selectedKeywords: new Set(),
      });
      expect(result).toHaveLength(4);
    });

    it("filters by status tab", () => {
      const result = filterJobs(jobs, {
        statusTab: "applying",
        scoreThreshold: 0,
        selectedKeywords: new Set(),
      });
      expect(result.map((j) => j.id)).toEqual([2]);
    });

    it("includes null scores when threshold is 0", () => {
      const result = filterJobs(jobs, {
        statusTab: "all",
        scoreThreshold: 0,
        selectedKeywords: new Set(),
      });
      expect(result.some((j) => j.score === null)).toBe(true);
    });

    it("excludes null scores when threshold is greater than 0", () => {
      const result = filterJobs(jobs, {
        statusTab: "all",
        scoreThreshold: 1,
        selectedKeywords: new Set(),
      });
      expect(result.every((j) => j.score !== null)).toBe(true);
    });

    it("filters by minimum score threshold", () => {
      const result = filterJobs(jobs, {
        statusTab: "all",
        scoreThreshold: 70,
        selectedKeywords: new Set(),
      });
      expect(result.map((j) => j.id)).toEqual([1]);
    });

    it("does not filter by keyword when none selected", () => {
      const result = filterJobs(jobs, {
        statusTab: "all",
        scoreThreshold: 0,
        selectedKeywords: new Set(),
      });
      expect(result).toHaveLength(4);
    });

    it("filters by selected keyword chips", () => {
      const result = filterJobs(jobs, {
        statusTab: "all",
        scoreThreshold: 0,
        selectedKeywords: new Set(["react"]),
      });
      expect(result.map((j) => j.id)).toEqual([1, 3]);
    });

    it("applies status, score, and keyword filters together", () => {
      const result = filterJobs(jobs, {
        statusTab: "new",
        scoreThreshold: 50,
        selectedKeywords: new Set(["react"]),
      });
      expect(result.map((j) => j.id)).toEqual([1]);
    });

    it("updates visible list without changing source order", () => {
      const filtered = filterJobs(jobs, {
        statusTab: "all",
        scoreThreshold: 0,
        selectedKeywords: new Set(["typescript"]),
      });
      expect(filtered.map((j) => j.id)).toEqual([2]);
    });
  });

  describe("job type helpers", () => {
    it("getScoreTier maps score ranges", () => {
      expect(getScoreTier(80)).toBe("high");
      expect(getScoreTier(60)).toBe("medium");
      expect(getScoreTier(40)).toBe("low");
      expect(getScoreTier(null)).toBe("none");
    });

    it("scoreBadgeClassName returns tier classes", () => {
      expect(scoreBadgeClassName("high")).toContain("emerald");
      expect(scoreBadgeClassName("medium")).toContain("amber");
      expect(scoreBadgeClassName("low")).toContain("red");
      expect(scoreBadgeClassName("none")).toContain("muted");
    });

    it("truncateDescription truncates long text with ellipsis", () => {
      const long = "a".repeat(450);
      expect(truncateDescription(long, 400)).toHaveLength(401);
      expect(truncateDescription(long, 400).endsWith("…")).toBe(true);
      expect(truncateDescription("short")).toBe("short");
    });
  });
});
