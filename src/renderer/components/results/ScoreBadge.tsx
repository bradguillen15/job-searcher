import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  getScoreTier,
  scoreBadgeClassName,
} from "@/types/job";
import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number | null;
}

function ScoreBadge({ score }: ScoreBadgeProps): React.JSX.Element {
  const tier = getScoreTier(score);
  const label = score === null ? "—" : String(score);

  return (
    <Badge
      variant="outline"
      className={cn("min-w-10 justify-center tabular-nums", scoreBadgeClassName(tier))}
    >
      {label}
    </Badge>
  );
}

export default ScoreBadge;
