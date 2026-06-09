import React, { useCallback, useEffect, useMemo, useState } from "react";
import BoardStatusList from "@/components/scout/BoardStatusList";
import DateRangeSelector from "@/components/scout/DateRangeSelector";
import ProgressLog from "@/components/scout/ProgressLog";
import SelectorRequiredDialog from "@/components/scout/SelectorRequiredDialog";
import { Button } from "@/components/ui/button";
import { useScraperProgress } from "@/hooks/useScraperProgress";
import { listBoards } from "@/lib/boards-db";
import { getLastCompletedRun } from "@/lib/runs-db";
import { loadDefaultDateRange } from "@/lib/scout-settings";
import type { Board } from "@/types/board";
import type {
  BoardRunStatus,
  DateRangeKey,
  LogLine,
  ScraperRunResult,
  SelectorRequiredState,
} from "@/types/scout";
import { isScraperBusyError, isScraperErrorResult } from "@/types/scout";

function formatLastRun(iso: string | null): string {
  if (!iso) {
    return "Never";
  }
  return new Date(iso).toLocaleString();
}

function boardsToStatuses(boards: Board[]): BoardRunStatus[] {
  return boards.map((board) => ({
    boardId: board.id,
    name: board.name,
    phase: "idle",
  }));
}

function ScoutScreen(): React.JSX.Element {
  const [dateRange, setDateRange] = useState<DateRangeKey>("30d");
  const [running, setRunning] = useState(false);
  const [logLines, setLogLines] = useState<LogLine[]>([]);
  const [boardStatuses, setBoardStatuses] = useState<BoardRunStatus[]>([]);
  const [boardErrors, setBoardErrors] = useState<Map<number, string>>(
    () => new Map()
  );
  const [selectorPrompt, setSelectorPrompt] =
    useState<SelectorRequiredState | null>(null);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshLastRun = useCallback(async (): Promise<void> => {
    const run = await getLastCompletedRun();
    setLastRunAt(run?.finished_at ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData(): Promise<void> {
      try {
        const [boards, defaultRange, lastRun] = await Promise.all([
          listBoards(),
          loadDefaultDateRange(),
          getLastCompletedRun(),
        ]);
        if (cancelled) {
          return;
        }
        setBoardStatuses(boardsToStatuses(boards));
        setDateRange(defaultRange);
        setLastRunAt(lastRun?.finished_at ?? null);
      } catch (err) {
        if (!cancelled) {
          setGlobalError((err as Error).message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInitialData();
    return () => {
      cancelled = true;
    };
  }, []);

  const clearSessionState = useCallback((): void => {
    setLogLines([]);
    setBoardErrors(new Map());
    setBoardStatuses((prev) =>
      prev.map((board) => ({
        ...board,
        phase: "idle",
        scraped: undefined,
        newCount: undefined,
      }))
    );
    setGlobalError(null);
  }, []);

  const mergeBoardErrors = useCallback(
    (errors: Array<{ boardId: number; message: string }>): void => {
      if (errors.length === 0) {
        return;
      }
      setBoardErrors((prev) => {
        const next = new Map(prev);
        for (const entry of errors) {
          next.set(entry.boardId, entry.message);
        }
        return next;
      });
      setBoardStatuses((prev) =>
        prev.map((board) => {
          const hasError = errors.some((e) => e.boardId === board.boardId);
          return hasError ? { ...board, phase: "error" } : board;
        })
      );
    },
    []
  );

  const progressHandlers = useMemo(
    () => ({
      onLogLine: (line: LogLine) => {
        setLogLines((prev) => [...prev, line]);
      },
      onBoardStart: (boardId: number, _boardName: string) => {
        setBoardStatuses((prev) =>
          prev.map((board) =>
            board.boardId === boardId ? { ...board, phase: "running" } : board
          )
        );
      },
      onBoardDone: (boardId: number, scraped: number, newCount: number) => {
        setBoardStatuses((prev) =>
          prev.map((board) =>
            board.boardId === boardId
              ? { ...board, phase: "done", scraped, newCount }
              : board
          )
        );
      },
      onSelectorRequired: (state: SelectorRequiredState) => {
        setSelectorPrompt(state);
      },
      onRunComplete: () => {
        setRunning(false);
      },
      onRunError: (message: string) => {
        setGlobalError(message);
        setRunning(false);
      },
      onBoardLogError: (boardId: number, message: string) => {
        setBoardErrors((prev) => {
          const next = new Map(prev);
          next.set(boardId, message);
          return next;
        });
        setBoardStatuses((prev) =>
          prev.map((board) =>
            board.boardId === boardId ? { ...board, phase: "error" } : board
          )
        );
      },
    }),
    []
  );

  useScraperProgress(progressHandlers);

  async function handleRun(): Promise<void> {
    clearSessionState();
    setRunning(true);

    try {
      const result = (await window.api.invoke("scraper:run", {
        dateRange,
      })) as ScraperRunResult;

      if (isScraperErrorResult(result)) {
        setGlobalError(result.error);
        return;
      }

      mergeBoardErrors(result.boardErrors);
      await refreshLastRun();
    } catch (err) {
      if (isScraperBusyError(err)) {
        setGlobalError("A scout session is already in progress.");
        return;
      }
      setGlobalError((err as Error).message);
    } finally {
      setRunning(false);
    }
  }

  async function handleSelectorSubmit(
    boardId: number,
    selector: string
  ): Promise<void> {
    setSelectorPrompt(null);
    try {
      await window.api.invoke("scraper:provideSelector", { boardId, selector });
    } catch (err) {
      setGlobalError((err as Error).message);
    }
  }

  async function handleSelectorCancel(boardId: number): Promise<void> {
    setSelectorPrompt(null);
    try {
      await window.api.invoke("scraper:provideSelector", {
        boardId,
        cancelled: true,
      });
    } catch (err) {
      setGlobalError((err as Error).message);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading scout…</p>;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Scout</h1>
        <p className="text-sm text-muted-foreground">
          Last run: {formatLastRun(lastRunAt)}
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <DateRangeSelector
          value={dateRange}
          onChange={setDateRange}
          disabled={running}
        />
        <Button onClick={() => void handleRun()} disabled={running}>
          Run Scout
        </Button>
      </div>

      {globalError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {globalError}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[2fr_3fr]">
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Boards
          </h2>
          <BoardStatusList boards={boardStatuses} errors={boardErrors} />
        </section>
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Progress
          </h2>
          <ProgressLog lines={logLines} />
        </section>
      </div>

      <SelectorRequiredDialog
        state={selectorPrompt}
        onSubmit={(boardId, selector) => void handleSelectorSubmit(boardId, selector)}
        onCancel={(boardId) => void handleSelectorCancel(boardId)}
      />
    </div>
  );
}

export default ScoutScreen;
