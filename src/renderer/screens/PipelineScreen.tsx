import React, { useCallback, useEffect, useMemo, useState } from "react";
import PipelineColumn from "@/components/pipeline/PipelineColumn";
import {
  addActivity,
  JobsDbError,
  listPipelineJobsWithMeta,
  updateJobStatus,
} from "@/lib/jobs-db";
import { groupPipelineJobs } from "@/lib/pipeline-grouping";
import {
  PIPELINE_STATUSES,
  type JobStatus,
  type PipelineJobWithMeta,
} from "@/types/job";

function PipelineScreen(): React.JSX.Element {
  const [jobs, setJobs] = useState<PipelineJobWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickAddJobId, setQuickAddJobId] = useState<number | null>(null);
  const [mutationPending, setMutationPending] = useState(false);

  const grouped = useMemo(() => groupPipelineJobs(jobs), [jobs]);

  const loadJobs = useCallback(async (): Promise<void> => {
    const rows = await listPipelineJobsWithMeta();
    setJobs(rows);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init(): Promise<void> {
      try {
        await loadJobs();
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof JobsDbError
              ? err.message
              : (err as Error).message;
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [loadJobs]);

  const handleQuickAddToggle = useCallback((jobId: number): void => {
    setQuickAddJobId((current) => (current === jobId ? null : jobId));
  }, []);

  const handleQuickAddCancel = useCallback((): void => {
    setQuickAddJobId(null);
  }, []);

  const handleAddNote = useCallback(
    async (jobId: number, note: string): Promise<void> => {
      setMutationPending(true);
      setError(null);
      try {
        const activity = await addActivity({
          jobId,
          type: "note",
          notes: note,
        });
        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? { ...job, last_activity_at: activity.created_at }
              : job
          )
        );
        setQuickAddJobId(null);
      } catch (err) {
        setError(
          err instanceof JobsDbError ? err.message : (err as Error).message
        );
      } finally {
        setMutationPending(false);
      }
    },
    []
  );

  const handleStatusChange = useCallback(
    async (jobId: number, nextStatus: JobStatus): Promise<void> => {
      setMutationPending(true);
      setError(null);
      try {
        await updateJobStatus(jobId, nextStatus);
        const activity = await addActivity({
          jobId,
          type: "status_change",
          notes: `Status set to ${nextStatus}`,
        });
        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  status: nextStatus,
                  last_activity_at: activity.created_at,
                }
              : job
          )
        );
      } catch (err) {
        setError(
          err instanceof JobsDbError ? err.message : (err as Error).message
        );
      } finally {
        setMutationPending(false);
      }
    },
    []
  );

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading pipeline…</p>;
  }

  const isEmpty = jobs.length === 0;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          {jobs.length} active {jobs.length === 1 ? "job" : "jobs"}
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {isEmpty ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
          <p className="text-muted-foreground">
            No jobs in your pipeline yet. On Results, change a job&apos;s
            status to Applying or beyond to track it here.
          </p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {PIPELINE_STATUSES.map((status) => (
            <PipelineColumn
              key={status}
              status={status}
              jobs={grouped[status]}
              quickAddJobId={quickAddJobId}
              onQuickAddToggle={handleQuickAddToggle}
              onQuickAddCancel={handleQuickAddCancel}
              onAddNote={handleAddNote}
              onStatusChange={handleStatusChange}
              mutationPending={mutationPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PipelineScreen;
