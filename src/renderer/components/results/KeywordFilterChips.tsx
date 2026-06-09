import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface KeywordFilterChipsProps {
  keywords: string[];
  selected: ReadonlySet<string>;
  onToggle: (keyword: string) => void;
}

function KeywordFilterChips({
  keywords,
  selected,
  onToggle,
}: KeywordFilterChipsProps): React.JSX.Element | null {
  if (keywords.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Keyword filters">
      {keywords.map((keyword) => {
        const isSelected = selected.has(keyword);
        return (
          <button
            key={keyword}
            type="button"
            onClick={() => onToggle(keyword)}
            aria-pressed={isSelected}
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Badge
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "cursor-pointer select-none",
                isSelected && "border-primary"
              )}
            >
              {keyword}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}

export default KeywordFilterChips;
