import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SelectorRequiredState } from "@/types/scout";

interface SelectorRequiredDialogProps {
  state: SelectorRequiredState | null;
  onSubmit: (boardId: number, selector: string) => void;
  onCancel: (boardId: number) => void;
}

function SelectorRequiredDialog({
  state,
  onSubmit,
  onCancel,
}: SelectorRequiredDialogProps): React.JSX.Element {
  const [selector, setSelector] = useState("");

  useEffect(() => {
    setSelector("");
  }, [state?.boardId]);

  const open = state !== null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && state) {
          onCancel(state.boardId);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>
            Search bar required — {state?.boardName ?? ""}
          </DialogTitle>
        </DialogHeader>
        {state && (
          <img
            src={`data:image/png;base64,${state.screenshotBase64}`}
            alt={`Screenshot of ${state.boardName} search area`}
            className="max-h-64 w-full rounded-md border border-border object-contain"
          />
        )}
        <div className="space-y-2">
          <Label htmlFor="search-selector">CSS selector</Label>
          <Input
            id="search-selector"
            className="font-mono"
            value={selector}
            onChange={(e) => setSelector(e.target.value)}
            placeholder="input[type='search']"
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => state && onCancel(state.boardId)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={selector.trim() === ""}
            onClick={() => state && onSubmit(state.boardId, selector.trim())}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SelectorRequiredDialog;
