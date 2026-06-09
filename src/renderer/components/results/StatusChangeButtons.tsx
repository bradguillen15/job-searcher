import React from "react";
import { Button } from "@/components/ui/button";
import { JOB_STATUSES, type JobStatus } from "@/types/job";
import { formatStatusLabel } from "@/types/job";

interface StatusChangeButtonsProps {
  current: JobStatus;
  onSelect: (status: JobStatus) => void;
  disabled?: boolean;
}

function StatusChangeButtons({
  current,
  onSelect,
  disabled = false,
}: StatusChangeButtonsProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Change status">
      {JOB_STATUSES.map((status) => (
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

export default StatusChangeButtons;
