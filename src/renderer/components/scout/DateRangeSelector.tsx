import React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DATE_RANGE_OPTIONS,
  type DateRangeKey,
} from "@/types/scout";

const DATE_RANGE_LABELS: Record<
  DateRangeKey,
  { short: string; aria: string }
> = {
  "24h": { short: "24h", aria: "24 hours" },
  "7d": { short: "7d", aria: "7 days" },
  "30d": { short: "30d", aria: "30 days" },
  "60d": { short: "60d", aria: "60 days" },
  "90d": { short: "90d", aria: "90 days" },
};

interface DateRangeSelectorProps {
  value: DateRangeKey;
  onChange: (value: DateRangeKey) => void;
  disabled?: boolean;
}

function DateRangeSelector({
  value,
  onChange,
  disabled = false,
}: DateRangeSelectorProps): React.JSX.Element {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(next) => {
        const selected = next[0];
        if (selected && (DATE_RANGE_OPTIONS as readonly string[]).includes(selected)) {
          onChange(selected as DateRangeKey);
        }
      }}
      disabled={disabled}
      variant="outline"
      size="sm"
      aria-label="Date range"
    >
      {DATE_RANGE_OPTIONS.map((key) => (
        <ToggleGroupItem
          key={key}
          value={key}
          aria-label={DATE_RANGE_LABELS[key].aria}
        >
          {DATE_RANGE_LABELS[key].short}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export default DateRangeSelector;
