import type { JobWithMeta, StatusTabKey } from "@/types/job";

export function distinctKeywords(jobs: JobWithMeta[]): string[] {
  const keywords = new Set<string>();
  for (const job of jobs) {
    keywords.add(job.keyword_text);
  }
  return [...keywords].sort((a, b) => a.localeCompare(b));
}

export function filterJobs(
  jobs: JobWithMeta[],
  options: {
    statusTab: StatusTabKey;
    scoreThreshold: number;
    selectedKeywords: ReadonlySet<string>;
  }
): JobWithMeta[] {
  return jobs.filter((job) => {
    if (options.statusTab !== "all" && job.status !== options.statusTab) {
      return false;
    }

    if (options.scoreThreshold > 0) {
      if (job.score === null || job.score < options.scoreThreshold) {
        return false;
      }
    }

    if (options.selectedKeywords.size > 0) {
      if (!options.selectedKeywords.has(job.keyword_text)) {
        return false;
      }
    }

    return true;
  });
}
