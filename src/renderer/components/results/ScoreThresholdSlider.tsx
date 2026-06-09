import React from "react";
import { cn } from "@/lib/utils";

interface ScoreThresholdSliderProps {
  value: number;
  onChange: (value: number) => void;
}

function ScoreThresholdSlider({
  value,
  onChange,
}: ScoreThresholdSliderProps): React.JSX.Element {
  const label = value === 0 ? "Any" : String(value);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <span className="shrink-0 text-sm text-muted-foreground">
        Min score: {label}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label="Minimum score threshold"
        className={cn(
          "h-1 w-full max-w-xs cursor-pointer appearance-none rounded-full bg-muted",
          "[&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none",
          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border",
          "[&::-webkit-slider-thumb]:border-ring [&::-webkit-slider-thumb]:bg-background"
        )}
      />
    </div>
  );
}

export default ScoreThresholdSlider;
