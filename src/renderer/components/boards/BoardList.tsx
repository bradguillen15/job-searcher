import React from "react";
import { Button } from "@/components/ui/button";
import type { Board } from "@/types/board";

interface BoardListProps {
  boards: Board[];
  onEdit: (board: Board) => void;
  onDelete: (board: Board) => void;
}

function BoardList({
  boards,
  onEdit,
  onDelete,
}: BoardListProps): React.JSX.Element {
  if (boards.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No boards yet. Add a board to start tracking job listings.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {boards.map((board) => (
        <li
          key={board.id}
          className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 space-y-1">
            <p className="font-medium">{board.name}</p>
            <p className="truncate font-mono text-sm text-muted-foreground">
              {board.url}
            </p>
            <p className="font-mono text-sm text-muted-foreground">
              {board.search_selector ?? "—"}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(board)}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onDelete(board)}
            >
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default BoardList;
