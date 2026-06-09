import React from "react";
import ScoreBadge from "@/components/results/ScoreBadge";
import { Card } from "@/components/ui/card";
import type { JobStatus, PipelineJobWithMeta } from "@/types/job";
import PipelineStatusButtons from "./PipelineStatusButtons";
import QuickAddActivity from "./QuickAddActivity";

interface PipelineJobCardProps {
  job: PipelineJobWithMeta;
  quickAddExpanded: boolean;
  onQuickAddToggle: () => void;
  onQuickAddCancel: () => void;
  onAddNote: (note: string) => void | Promise<void>;
  onStatusChange: (status: JobStatus) => void | Promise<void>;
  mutationPending?: boolean;
}

function formatLastActivity(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

function PipelineJobCard({
  job,
  quickAddExpanded,
  onQuickAddToggle,
  onQuickAddCancel,
  onAddNote,
  onStatusChange,
  mutationPending = false,
}: PipelineJobCardProps): React.JSX.Element {
  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{job.title}</p>
          {job.company && (
            <p className="truncate text-xs text-muted-foreground">
              {job.company}
            </p>
          )}
        </div>
        <ScoreBadge score={job.score} />
      </div>

      {job.last_activity_at ? (
        <p className="font-mono text-xs text-muted-foreground">
          {formatLastActivity(job.last_activity_at)}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">No activity</p>
      )}

      <QuickAddActivity
        expanded={quickAddExpanded}
        onToggle={onQuickAddToggle}
        onCancel={onQuickAddCancel}
        onSubmit={onAddNote}
        disabled={mutationPending}
      />

      <PipelineStatusButtons
        current={job.status}
        onSelect={onStatusChange}
        disabled={mutationPending}
      />
    </Card>
  );
}

export default PipelineJobCard;
