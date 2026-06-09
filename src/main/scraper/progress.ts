import type { WebContents } from "electron";
import type { ProgressEvent, ProgressEmitter } from "./types";

export function emitProgress(
  webContents: WebContents | null | undefined,
  event: Omit<ProgressEvent, "timestamp"> & { timestamp?: string }
): void {
  if (!webContents || webContents.isDestroyed()) {
    return;
  }

  const payload: ProgressEvent = {
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
  } as ProgressEvent;

  webContents.send("scraper:progress", payload);
}

export function createProgressEmitter(
  getWebContents: () => WebContents | null | undefined
): ProgressEmitter {
  return (event: ProgressEvent) => {
    emitProgress(getWebContents(), event);
  };
}
