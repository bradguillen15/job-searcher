import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { WebContents } from "electron";

import {
  createProgressEmitter,
  emitProgress,
} from "../../../src/main/scraper/progress.js";
import type { ProgressEvent } from "../../../src/main/scraper/types.js";

type EmitPayload = Omit<ProgressEvent, "timestamp"> & { timestamp?: string };

function mockWebContents(options: {
  destroyed?: boolean;
  onSend?: (channel: string, payload: unknown) => void;
}): WebContents {
  return {
    isDestroyed: () => options.destroyed ?? false,
    send: (channel: string, payload: unknown) => {
      options.onSend?.(channel, payload);
    },
  } as unknown as WebContents;
}

describe("emitProgress", () => {
  it("sends scraper:progress with payload including timestamp", () => {
    const captured = {
      channel: "",
      payload: null as ProgressEvent | null,
    };

    const webContents = mockWebContents({
      onSend: (ch, pl) => {
        captured.channel = ch;
        captured.payload = pl as ProgressEvent;
      },
    });

    emitProgress(webContents, {
      type: "log",
      message: "hello",
    } as EmitPayload);

    assert.equal(captured.channel, "scraper:progress");
    assert.ok(captured.payload);
    assert.equal(captured.payload.type, "log");
    if (captured.payload.type === "log") {
      assert.equal(captured.payload.message, "hello");
    }
    assert.ok(typeof captured.payload.timestamp === "string");
  });

  it("preserves provided timestamp", () => {
    const captured = { payload: null as ProgressEvent | null };

    const webContents = mockWebContents({
      onSend: (_ch, pl) => {
        captured.payload = pl as ProgressEvent;
      },
    });

    emitProgress(webContents, {
      type: "run_complete",
      timestamp: "2026-06-08T12:00:00.000Z",
      runId: 1,
      totalScraped: 0,
      totalNew: 0,
    } as EmitPayload);

    assert.equal(captured.payload!.timestamp, "2026-06-08T12:00:00.000Z");
  });

  it("no-ops when webContents is null", () => {
    assert.doesNotThrow(() =>
      emitProgress(null, {
        type: "log",
        message: "ignored",
      } as EmitPayload)
    );
  });

  it("no-ops when webContents is destroyed", () => {
    let sent = false;
    const webContents = mockWebContents({
      destroyed: true,
      onSend: () => {
        sent = true;
      },
    });

    emitProgress(webContents, {
      type: "log",
      message: "ignored",
    } as EmitPayload);

    assert.equal(sent, false);
  });
});

describe("createProgressEmitter", () => {
  it("forwards events through getWebContents to webContents.send", () => {
    const sent: Array<{ channel: string; payload: unknown }> = [];
    const webContents = mockWebContents({
      onSend: (channel, payload) => {
        sent.push({ channel, payload });
      },
    });

    const emit = createProgressEmitter(() => webContents);

    emit({
      type: "board_start",
      timestamp: "2026-06-08T12:00:00.000Z",
      boardId: 1,
      boardName: "Example Board",
    });

    assert.equal(sent.length, 1);
    assert.equal(sent[0]!.channel, "scraper:progress");
    assert.deepEqual(sent[0]!.payload, {
      type: "board_start",
      timestamp: "2026-06-08T12:00:00.000Z",
      boardId: 1,
      boardName: "Example Board",
    });
  });

  it("no-ops when getWebContents returns null", () => {
    const emit = createProgressEmitter(() => null);

    assert.doesNotThrow(() =>
      emit({
        type: "run_error",
        timestamp: "2026-06-08T12:00:00.000Z",
        message: "fail",
      })
    );
  });
});
