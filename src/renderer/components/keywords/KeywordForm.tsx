import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface KeywordFormValues {
  keyword: string;
}

interface KeywordFormProps {
  submitLabel: string;
  pending?: boolean;
  onSubmit: (values: KeywordFormValues) => void;
  onCancel: () => void;
}

function KeywordForm({
  submitLabel,
  pending = false,
  onSubmit,
  onCancel,
}: KeywordFormProps): React.JSX.Element {
  const [keyword, setKeyword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>): void => {
      event.preventDefault();

      const trimmed = keyword.trim();
      if (trimmed === "") {
        setValidationError("Keyword is required.");
        return;
      }

      setValidationError(null);
      onSubmit({ keyword: trimmed });
    },
    [keyword, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="keyword-text">Keyword</Label>
        <Input
          id="keyword-text"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          disabled={pending}
          aria-invalid={validationError !== null && keyword.trim() === ""}
        />
      </div>

      {validationError !== null ? (
        <p className="text-sm text-destructive" role="alert">
          {validationError}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default KeywordForm;
