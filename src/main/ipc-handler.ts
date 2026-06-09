import { ipcMain } from "electron";
import type Database from "better-sqlite3";
import { db } from "./db";
import {
  createProfile,
  deleteProfile,
  listProfiles,
  switchProfile,
} from "./profiles";
import { uploadResume } from "./resume";
import { getMainWindow } from "./main-window";
import { createProgressEmitter } from "./scraper/progress";
import {
  provideSelector,
  runScraper,
  ScraperBusyError,
  ScraperNotWaitingError,
} from "./scraper/run";
import type { ScraperProvideSelectorPayload, ScraperRunPayload } from "./scraper/types";

export class UnknownChannelError extends Error {
  constructor(channel: string) {
    super(`Unknown IPC channel: ${channel}`);
    this.name = "UnknownChannelError";
  }
}

const ALLOWED_CHANNELS = [
  "db:query",
  "scraper:run",
  "scraper:provideSelector",
  "ollama:list",
  "fs:openPath",
  "profiles:list",
  "profiles:create",
  "profiles:switch",
  "profiles:delete",
  "resume:upload",
] as const;
export type AllowedChannel = (typeof ALLOWED_CHANNELS)[number];

export type QueryResult =
  | unknown[]
  | { changes: number; lastInsertRowid: number }
  | { error: string };

export function runQuery(
  database: Database.Database,
  sql: string,
  params: unknown[]
): QueryResult {
  try {
    const stmt = database.prepare(sql);
    const trimmed = sql.trimStart().toUpperCase();

    if (
      trimmed.startsWith("SELECT") ||
      trimmed.startsWith("WITH") ||
      trimmed.startsWith("PRAGMA")
    ) {
      return stmt.all(...params) as unknown[];
    }

    const result = stmt.run(...params);
    return {
      changes: result.changes,
      lastInsertRowid: Number(result.lastInsertRowid),
    };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

const progressEmitter = createProgressEmitter(
  () => getMainWindow()?.webContents
);

export function registerIpcHandlers(): void {
  ipcMain.handle(
    "db:query",
    (_event, payload: { sql: string; params: unknown[] }) =>
      runQuery(db, payload.sql, payload.params)
  );

  ipcMain.handle("profiles:list", () => listProfiles());

  ipcMain.handle("profiles:create", (_event, name: string) => createProfile(name));

  ipcMain.handle("profiles:switch", (_event, profileId: string) => {
    switchProfile(profileId);
  });

  ipcMain.handle("profiles:delete", (_event, profileId: string) => {
    deleteProfile(profileId);
  });

  ipcMain.handle("resume:upload", () => uploadResume());

  ipcMain.handle("scraper:run", async (_event, payload: ScraperRunPayload) => {
    try {
      return await runScraper(payload, progressEmitter);
    } catch (err) {
      if (err instanceof ScraperBusyError) {
        throw err;
      }
      return { error: (err as Error).message };
    }
  });

  ipcMain.handle(
    "scraper:provideSelector",
    (_event, payload: ScraperProvideSelectorPayload) => {
      provideSelector(payload);
    }
  );

  for (const channel of ALLOWED_CHANNELS) {
    if (
      channel === "db:query" ||
      channel.startsWith("profiles:") ||
      channel === "resume:upload" ||
      channel === "scraper:run" ||
      channel === "scraper:provideSelector"
    ) {
      continue;
    }
    ipcMain.handle(channel, async (_event, ...args: unknown[]) => {
      return { channel, args, stub: true };
    });
  }
}

export function validateChannel(channel: string): AllowedChannel {
  if ((ALLOWED_CHANNELS as readonly string[]).includes(channel)) {
    return channel as AllowedChannel;
  }
  throw new UnknownChannelError(channel);
}

export { ScraperBusyError, ScraperNotWaitingError };
