import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  formatStatusLabel,
  type JobStatus,
  type PipelineJobWithMeta,
} from "@/types/job";
import PipelineJobCard from "./PipelineJobCard";

interface PipelineColumnProps {
  status: JobStatus;
  jobs: PipelineJobWithMeta[];
  quickAddJobId: number | null;
  onQuickAddToggle: (jobId: number) => void;
  onQuickAddCancel: () => void;
  onAddNote: (jobId: number, note: string) => void | Promise<void>;
  onStatusChange: (
    jobId: number,
    status: JobStatus
  ) => void | Promise<void>;
  mutationPending?: boolean;
}

function PipelineColumn({
  status,
  jobs,
  quickAddJobId,
  onQuickAddToggle,
  onQuickAddCancel,
  onAddNote,
  onStatusChange,
  mutationPending = false,
}: PipelineColumnProps): React.JSX.Element {
  const label = formatStatusLabel(status);

  return (
    <section
      className="flex w-60 shrink-0 flex-col rounded-lg border border-border bg-muted/30"
      aria-label={`${label} column`}
    >
      <header className="flex items-center justify-between border-b border-border px-3 py-2">
        <h2 className="text-sm font-medium">{label}</h2>
        <Badge variant="secondary" className="tabular-nums">
          {jobs.length}
        </Badge>
      </header>

      <div className="flex flex-1 flex-col gap-2 p-2">
        {jobs.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No jobs
          </p>
        ) : (
          jobs.map((job) => (
            <PipelineJobCard
              key={job.id}
              job={job}
              quickAddExpanded={quickAddJobId === job.id}
              onQuickAddToggle={() => onQuickAddToggle(job.id)}
              onQuickAddCancel={onQuickAddCancel}
              onAddNote={(note) => onAddNote(job.id, note)}
              onStatusChange={(nextStatus) =>
                onStatusChange(job.id, nextStatus)
              }
              mutationPending={mutationPending}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default PipelineColumn;
