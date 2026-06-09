import React, { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LogLine } from "@/types/scout";
import { cn } from "@/lib/utils";

interface ProgressLogProps {
  lines: LogLine[];
  className?: string;
}

function ProgressLog({ lines, className }: ProgressLogProps): React.JSX.Element {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!stickToBottomRef.current || !bottomRef.current) {
      return;
    }
    bottomRef.current.scrollIntoView?.({ block: "end" });
  }, [lines]);

  function handleScroll(): void {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const distanceFromBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 48;
  }

  return (
    <ScrollArea
      className={cn("h-64 rounded-lg border border-border bg-background md:h-96", className)}
    >
      <div
        ref={viewportRef}
        onScroll={handleScroll}
        className="max-h-64 overflow-y-auto p-3 md:max-h-96"
        data-testid="progress-log-viewport"
      >
        {lines.length === 0 ? (
          <p className="font-mono text-sm text-muted-foreground">
            Progress output will appear here when a scout session runs.
          </p>
        ) : (
          <ul className="space-y-1">
            {lines.map((line) => (
              <li key={line.id} className="font-mono text-sm">
                <span className="text-muted-foreground">[{line.timestamp}]</span>{" "}
                {line.text}
              </li>
            ))}
          </ul>
        )}
        <div ref={bottomRef} aria-hidden="true" />
      </div>
    </ScrollArea>
  );
}

export default ProgressLog;
