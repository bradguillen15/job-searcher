import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AddNoteFormProps {
  onSubmit: (note: string) => void | Promise<void>;
  disabled?: boolean;
}

function AddNoteForm({
  onSubmit,
  disabled = false,
}: AddNoteFormProps): React.JSX.Element {
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
        aria-label="Note"
      />
      {validationError && (
        <p className="text-sm text-destructive" role="alert">
          {validationError}
        </p>
      )}
      <Button type="submit" size="sm" disabled={disabled || submitting}>
        Add note
      </Button>
    </form>
  );
}

export default AddNoteForm;
