import {
  PIPELINE_STATUSES,
  type PipelineJobWithMeta,
} from "@/types/job";

export type PipelineColumnMap = Record<
  (typeof PIPELINE_STATUSES)[number],
  PipelineJobWithMeta[]
>;

export function sortJobsInColumn(
  jobs: PipelineJobWithMeta[]
): PipelineJobWithMeta[] {
  const dated = jobs.filter((job) => job.last_activity_at !== null);
  const undated = jobs.filter((job) => job.last_activity_at === null);

  dated.sort((a, b) => {
    const aTime = new Date(a.last_activity_at as string).getTime();
    const bTime = new Date(b.last_activity_at as string).getTime();
    return bTime - aTime;
  });

  undated.sort((a, b) => a.title.localeCompare(b.title));

  return [...dated, ...undated];
}

export function groupPipelineJobs(
  jobs: PipelineJobWithMeta[]
): PipelineColumnMap {
  const columns = Object.fromEntries(
    PIPELINE_STATUSES.map((status) => [status, [] as PipelineJobWithMeta[]])
  ) as PipelineColumnMap;

  for (const job of jobs) {
    columns[job.status].push(job);
  }

  for (const status of PIPELINE_STATUSES) {
    columns[status] = sortJobsInColumn(columns[status]);
  }

  return columns;
}
