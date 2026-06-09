import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface QuickAddActivityProps {
  expanded: boolean;
  onToggle: () => void;
  onSubmit: (note: string) => void | Promise<void>;
  onCancel: () => void;
  disabled?: boolean;
}

function QuickAddActivity({
  expanded,
  onToggle,
  onSubmit,
  onCancel,
  disabled = false,
}: QuickAddActivityProps): React.JSX.Element {
  const [note, setNote] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const trimmed = note.trim();
    if (!trimmed) {
      setValidationError("Note cannot be empty.");
      return;
    }
    setValidationError(null);
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setNote("");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel(): void {
    setNote("");
    setValidationError(null);
    onCancel();
  }

  if (!expanded) {
    return (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={disabled}
        onClick={onToggle}
      >
        Quick add
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={note}
        onChange={(event) => {
          setNote(event.target.value);
          if (validationError) {
            setValidationError(null);
          }
        }}
        placeholder="Add a note…"
        disabled={disabled || submitting}
        aria-label="Quick add note"
        className="min-h-16 text-sm"
      />
      {validationError && (
        <p className="text-sm text-destructive" role="alert">
          {validationError}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={disabled || submitting}>
          Save
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || submitting}
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default QuickAddActivity;
