import React, { useCallback, useEffect, useMemo, useState } from "react";
import JobCard from "@/components/results/JobCard";
import KeywordFilterChips from "@/components/results/KeywordFilterChips";
import ScoreThresholdSlider from "@/components/results/ScoreThresholdSlider";
import StatusTabs from "@/components/results/StatusTabs";
import {
  addActivity,
  JobsDbError,
  listActivities,
  listJobsWithMeta,
  updateJobStatus,
} from "@/lib/jobs-db";
import { distinctKeywords, filterJobs } from "@/lib/results-filters";
import type { Activity, JobStatus, JobWithMeta, StatusTabKey } from "@/types/job";

function ResultsScreen(): React.JSX.Element {
  const [jobs, setJobs] = useState<JobWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<StatusTabKey>("all");
  const [scoreThreshold, setScoreThreshold] = useState(0);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(
    () => new Set()
  );
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [activitiesByJobId, setActivitiesByJobId] = useState<
    Map<number, Activity[]>
  >(() => new Map());
  const [activitiesLoading, setActivitiesLoading] = useState<number | null>(
    null
  );
  const [mutationPending, setMutationPending] = useState(false);

  const loadJobs = useCallback(async (): Promise<void> => {
    const rows = await listJobsWithMeta();
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

  const keywordOptions = useMemo(() => distinctKeywords(jobs), [jobs]);

  const filteredJobs = useMemo(
    () =>
      filterJobs(jobs, {
        statusTab,
        scoreThreshold,
        selectedKeywords,
      }),
    [jobs, statusTab, scoreThreshold, selectedKeywords]
  );

  const refreshActivities = useCallback(async (jobId: number): Promise<void> => {
    setActivitiesLoading(jobId);
    try {
      const activities = await listActivities(jobId);
      setActivitiesByJobId((prev) => {
        const next = new Map(prev);
        next.set(jobId, activities);
        return next;
      });
    } catch (err) {
      setError(
        err instanceof JobsDbError ? err.message : (err as Error).message
      );
    } finally {
      setActivitiesLoading((current) => (current === jobId ? null : current));
    }
  }, []);

  const handleToggleExpand = useCallback(
    (jobId: number): void => {
      setExpandedJobId((current) => {
        const next = current === jobId ? null : jobId;
        if (next !== null && !activitiesByJobId.has(next)) {
          void refreshActivities(next);
        }
        return next;
      });
    },
    [activitiesByJobId, refreshActivities]
  );

  const handleKeywordToggle = useCallback((keyword: string): void => {
    setSelectedKeywords((prev) => {
      const next = new Set(prev);
      if (next.has(keyword)) {
        next.delete(keyword);
      } else {
        next.add(keyword);
      }
      return next;
    });
  }, []);

  const handleStatusChange = useCallback(
    async (jobId: number, nextStatus: JobStatus): Promise<void> => {
      setMutationPending(true);
      setError(null);
      try {
        await updateJobStatus(jobId, nextStatus);
        await addActivity({
          jobId,
          type: "status_change",
          notes: `Status set to ${nextStatus}`,
        });
        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId ? { ...job, status: nextStatus } : job
          )
        );
        await refreshActivities(jobId);
      } catch (err) {
        setError(
          err instanceof JobsDbError ? err.message : (err as Error).message
        );
      } finally {
        setMutationPending(false);
      }
    },
    [refreshActivities]
  );

  const handleAddNote = useCallback(
    async (jobId: number, note: string): Promise<void> => {
      setMutationPending(true);
      setError(null);
      try {
        await addActivity({ jobId, type: "note", notes: note });
        await refreshActivities(jobId);
      } catch (err) {
        setError(
          err instanceof JobsDbError ? err.message : (err as Error).message
        );
      } finally {
        setMutationPending(false);
      }
    },
    [refreshActivities]
  );

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading results…</p>;
  }

  const showEmptyScout = jobs.length === 0;
  const showNoMatches = jobs.length > 0 && filteredJobs.length === 0;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Results</h1>
        <p className="text-sm text-muted-foreground">
          {filteredJobs.length} of {jobs.length} jobs
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

      <div className="space-y-4">
        <StatusTabs value={statusTab} onChange={setStatusTab} />
        <ScoreThresholdSlider
          value={scoreThreshold}
          onChange={setScoreThreshold}
        />
        <KeywordFilterChips
          keywords={keywordOptions}
          selected={selectedKeywords}
          onToggle={handleKeywordToggle}
        />
      </div>

      {showEmptyScout ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
          <p className="text-muted-foreground">
            No jobs yet. Run Scout to discover listings.
          </p>
        </div>
      ) : showNoMatches ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
          <p className="text-muted-foreground">
            No jobs match the current filters.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {filteredJobs.map((job) => (
            <li key={job.id}>
              <JobCard
                job={job}
                expanded={expandedJobId === job.id}
                onToggleExpand={() => handleToggleExpand(job.id)}
                activities={activitiesByJobId.get(job.id) ?? []}
                activitiesLoading={activitiesLoading === job.id}
                onStatusChange={(status) =>
                  void handleStatusChange(job.id, status)
                }
                onAddNote={(note) => void handleAddNote(job.id, note)}
                mutationPending={mutationPending}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ResultsScreen;
