import React, { useEffect, useState } from "react";
import DateRangeSelector from "@/components/scout/DateRangeSelector";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  loadDefaultDateRangeSetting,
  saveDefaultDateRangeSetting,
} from "@/lib/settings-db";
import type { DateRangeKey } from "@/types/scout";

function ScoutDefaultsSection(): React.JSX.Element {
  const [dateRange, setDateRange] = useState<DateRangeKey>("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const value = await loadDefaultDateRangeSetting();
        if (!cancelled) {
          setDateRange(value);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = async (value: DateRangeKey): Promise<void> => {
    setDateRange(value);
    setError(null);
    try {
      await saveDefaultDateRangeSetting(value);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scout defaults</CardTitle>
        <CardDescription>
          Default date range applied when Scout opens.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <DateRangeSelector
          value={dateRange}
          onChange={(value) => {
            void handleChange(value);
          }}
          disabled={loading}
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default ScoutDefaultsSection;
