import React from "react";
import { Button } from "@/components/ui/button";
import {
  formatStatusLabel,
  PIPELINE_STATUSES,
  type JobStatus,
} from "@/types/job";

interface PipelineStatusButtonsProps {
  current: JobStatus;
  onSelect: (status: JobStatus) => void;
  disabled?: boolean;
}

function PipelineStatusButtons({
  current,
  onSelect,
  disabled = false,
}: PipelineStatusButtonsProps): React.JSX.Element {
  return (
    <div
      className="flex flex-wrap gap-1"
      role="group"
      aria-label="Change pipeline status"
    >
      {PIPELINE_STATUSES.map((status) => (
        <Button
          key={status}
          type="button"
          size="sm"
          variant={status === current ? "default" : "outline"}
          disabled={disabled}
          onClick={() => onSelect(status)}
          aria-pressed={status === current}
        >
          {formatStatusLabel(status)}
        </Button>
      ))}
    </div>
  );
}

export default PipelineStatusButtons;
