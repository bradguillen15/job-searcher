import React from "react";
import type { BoardRunStatus } from "@/types/scout";
import { cn } from "@/lib/utils";

interface BoardStatusListProps {
  boards: BoardRunStatus[];
  errors: Map<number, string>;
}

const PHASE_LABELS: Record<BoardRunStatus["phase"], string> = {
  idle: "Idle",
  running: "Running",
  done: "Done",
  error: "Error",
};

function phaseBadgeClass(phase: BoardRunStatus["phase"]): string {
  switch (phase) {
    case "running":
      return "border-accent text-accent animate-pulse";
    case "done":
      return "border-muted-foreground/40 text-muted-foreground";
    case "error":
      return "border-destructive text-destructive";
    default:
      return "border-border text-muted-foreground";
  }
}

function BoardStatusList({
  boards,
  errors,
}: BoardStatusListProps): React.JSX.Element {
  if (boards.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No boards configured. Add boards under Boards &amp; Keywords.
      </p>
    );
  }

  return (
    <ul className="space-y-3" data-testid="board-status-list">
      {boards.map((board) => {
        const error = errors.get(board.boardId);
        const phase = error ? "error" : board.phase;

        return (
          <li
            key={board.boardId}
            className={cn(
              "rounded-lg border border-border p-3",
              board.phase === "running" && "border-accent"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{board.name}</span>
              <span
                className={cn(
                  "rounded-md border px-2 py-0.5 text-xs font-medium",
                  phaseBadgeClass(phase)
                )}
              >
                {PHASE_LABELS[phase]}
              </span>
            </div>
            {board.phase === "done" && board.scraped !== undefined && (
              <p className="mt-1 text-sm text-muted-foreground">
                {board.scraped} scraped · {board.newCount ?? 0} new
              </p>
            )}
            {error && (
              <p
                className="mt-1 text-sm text-destructive"
                data-testid={`board-error-${board.boardId}`}
              >
                {error}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default BoardStatusList;
