import React from "react";
import { ChevronDown } from "lucide-react";
import ActivityLog from "@/components/results/ActivityLog";
import AddNoteForm from "@/components/results/AddNoteForm";
import ScoreBadge from "@/components/results/ScoreBadge";
import StatusChangeButtons from "@/components/results/StatusChangeButtons";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Activity, JobStatus, JobWithMeta } from "@/types/job";
import { formatStatusLabel, truncateDescription } from "@/types/job";
import { cn } from "@/lib/utils";

function formatPostedDate(value: string | null): string {
  if (!value) {
    return "—";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString();
}

interface JobCardProps {
  job: JobWithMeta;
  expanded: boolean;
  onToggleExpand: () => void;
  activities: Activity[];
  activitiesLoading: boolean;
  onStatusChange: (status: JobStatus) => void | Promise<void>;
  onAddNote: (note: string) => void | Promise<void>;
  mutationPending?: boolean;
}

function JobCard({
  job,
  expanded,
  onToggleExpand,
  activities,
  activitiesLoading,
  onStatusChange,
  onAddNote,
  mutationPending = false,
}: JobCardProps): React.JSX.Element {
  async function handleOpenUrl(): Promise<void> {
    await window.api.invoke("fs:openPath", job.url);
  }

  return (
    <Collapsible open={expanded} onOpenChange={() => onToggleExpand()}>
      <div className="border-b border-border">
        <CollapsibleTrigger
          className={cn(
            "flex w-full items-start gap-3 px-1 py-4 text-left transition-colors",
            "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <ChevronDown
            className={cn(
              "mt-1 size-4 shrink-0 text-muted-foreground transition-transform",
              expanded && "rotate-180"
            )}
            aria-hidden
          />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium">{job.title}</h3>
              <ScoreBadge score={job.score} />
            </div>
            <p className="text-sm text-muted-foreground">
              {[job.company, job.location].filter(Boolean).join(" · ") || "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatStatusLabel(job.status)} · {job.keyword_text} ·{" "}
              {job.board_name} · {formatPostedDate(job.posted_date)}
            </p>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="px-1 pb-4 pl-8">
          <div className="space-y-4">
            {job.description && (
              <p className="text-sm whitespace-pre-wrap">
                {truncateDescription(job.description)}
              </p>
            )}

            {job.match_reason && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Match reason
                </p>
                <p className="text-sm">{job.match_reason}</p>
              </div>
            )}

            {job.url && (
              <button
                type="button"
                onClick={() => void handleOpenUrl()}
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                Open posting
              </button>
            )}

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Status</p>
              <StatusChangeButtons
                current={job.status}
                onSelect={onStatusChange}
                disabled={mutationPending}
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Activity log
              </p>
              <ActivityLog
                activities={activities}
                loading={activitiesLoading}
              />
            </div>

            <AddNoteForm onSubmit={onAddNote} disabled={mutationPending} />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default JobCard;
