import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export interface BoardFormValues {
  name: string;
  url: string;
  searchSelector: string;
}

interface BoardFormProps {
  initialValues?: BoardFormValues;
  submitLabel: string;
  pending?: boolean;
  onSubmit: (values: BoardFormValues) => void;
  onCancel: () => void;
}

const EMPTY_VALUES: BoardFormValues = {
  name: "",
  url: "",
  searchSelector: "",
};

function BoardForm({
  initialValues = EMPTY_VALUES,
  submitLabel,
  pending = false,
  onSubmit,
  onCancel,
}: BoardFormProps): React.JSX.Element {
  const [name, setName] = useState(initialValues.name);
  const [url, setUrl] = useState(initialValues.url);
  const [searchSelector, setSearchSelector] = useState(
    initialValues.searchSelector
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setName(initialValues.name);
    setUrl(initialValues.url);
    setSearchSelector(initialValues.searchSelector);
    setValidationError(null);
  }, [initialValues]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>): void => {
      event.preventDefault();

      const trimmedName = name.trim();
      const trimmedUrl = url.trim();

      if (trimmedName === "" || trimmedUrl === "") {
        setValidationError("Name and URL are required.");
        return;
      }

      setValidationError(null);
      onSubmit({
        name: trimmedName,
        url: trimmedUrl,
        searchSelector,
      });
    },
    [name, url, searchSelector, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="board-name">Name</Label>
        <Input
          id="board-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={pending}
          aria-invalid={validationError !== null && name.trim() === ""}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="board-url">URL</Label>
        <Input
          id="board-url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          disabled={pending}
          className="font-mono"
          aria-invalid={validationError !== null && url.trim() === ""}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="board-search-selector">Search selector</Label>
        <Input
          id="board-search-selector"
          value={searchSelector}
          onChange={(event) => setSearchSelector(event.target.value)}
          disabled={pending}
          className="font-mono"
          placeholder="CSS selector for search input"
        />
        <p className="text-xs text-muted-foreground">
          Optional CSS selector for the job board search input.
        </p>
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

export default BoardForm;
