import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function isOpenPathError(
  result: unknown
): result is { error: string } {
  return (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    typeof (result as { error: string }).error === "string"
  );
}

function DataSection(): React.JSX.Element {
  const [dbPath, setDbPath] = useState("");
  const [loading, setLoading] = useState(true);
  const [openError, setOpenError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const path = await window.api.invoke("profiles:activeDbPath");
        if (!cancelled && typeof path === "string") {
          setDbPath(path);
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

  const handleOpenInFinder = async (): Promise<void> => {
    if (!dbPath) {
      return;
    }
    setOpenError(null);
    const result = await window.api.invoke("fs:openPath", dbPath);
    if (isOpenPathError(result)) {
      setOpenError(result.error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data</CardTitle>
        <CardDescription>
          Active profile database location on this machine.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            readOnly
            value={dbPath}
            aria-label="Database path"
            className="font-mono"
            disabled={loading}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void handleOpenInFinder();
            }}
            disabled={loading || !dbPath}
          >
            Open in Finder
          </Button>
        </div>
        {openError ? (
          <p className="text-sm text-destructive" role="alert">
            {openError}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default DataSection;
