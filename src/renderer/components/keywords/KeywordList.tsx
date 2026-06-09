import React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { Keyword } from "@/types/keyword";

interface KeywordListProps {
  keywords: Keyword[];
  pending?: boolean;
  onToggleActive: (keyword: Keyword, active: boolean) => void;
  onDelete: (keyword: Keyword) => void;
}

function KeywordList({
  keywords,
  pending = false,
  onToggleActive,
  onDelete,
}: KeywordListProps): React.JSX.Element {
  if (keywords.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No keywords yet. Add a keyword to refine job searches.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {keywords.map((keyword) => {
        const isActive = keyword.active === 1;

        return (
          <li
            key={keyword.id}
            className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <p
              className={cn(
                "font-medium",
                !isActive && "text-muted-foreground"
              )}
            >
              {keyword.keyword}
            </p>
            <div className="flex shrink-0 items-center gap-3">
              <Switch
                checked={isActive}
                disabled={pending}
                aria-label={`Toggle ${keyword.keyword} active`}
                onCheckedChange={(checked) => {
                  onToggleActive(keyword, checked);
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={pending}
                onClick={() => onDelete(keyword)}
              >
                Delete
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default KeywordList;
