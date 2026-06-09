import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { db, openDatabase } from "../../../../src/main/db.js";
import { createAiBackend } from "../../../../src/main/matcher/backends/factory.js";
import { runMatching } from "../../../../src/main/matcher/run.js";
import { createRun } from "../../../../src/main/scraper/jobs-db.js";
import type { ProgressEvent } from "../../../../src/main/scraper/types.js";

const FORBIDDEN_PATTERNS = [
  /matcher\/backends/,
  /createAiBackend/,
  /createOllamaBackend/,
  /createAnthropicBackend/,
];

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectSourceFiles(full));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry)) {
      files.push(full);
    }
  }

  return files;
}

describe("AI backend main-process boundary", () => {
  it("renderer and preload do not import matcher backends", () => {
    const root = resolve(__dirname, "../../../..");
    const scanTargets = [
      join(root, "src/renderer"),
      join(root, "src/main/preload.ts"),
    ];
    const violations: string[] = [];

    for (const target of scanTargets) {
      const files = statSync(target).isDirectory()
        ? collectSourceFiles(target)
        : [target];

      for (const file of files) {
        const source = readFileSync(file, "utf8");
        for (const pattern of FORBIDDEN_PATTERNS) {
          if (pattern.test(source)) {
            violations.push(`${file}: matches ${pattern}`);
          }
        }
      }
    }

    assert.deepEqual(violations, []);
  });

  it("createAiBackend resolves from main matcher backends", () => {
    const backend = createAiBackend({
      backend: "ollama",
      ollamaBaseUrl: "http://localhost:11434",
      ollamaModel: "llama3.2",
      anthropicModel: "claude-3-5-haiku-20241022",
      anthropicApiKey: undefined,
    });

    assert.equal(backend.name, "ollama");
    assert.equal(typeof backend.complete, "function");
  });

  it("runMatching uses main-process createAiBackend when factory omitted", async () => {
    openDatabase(":memory:");
    const events: ProgressEvent[] = [];
    const emit = (event: ProgressEvent) => {
      events.push(event);
    };

    const runId = createRun();
    db.prepare("INSERT INTO resume (filename, raw_text) VALUES (?, ?)").run(
      "cv.pdf",
      "TypeScript engineer"
    );

    let fetchCalled = false;
    const fetchFn = (async () => {
      fetchCalled = true;
      return new Response(
        JSON.stringify({ message: { content: "- TypeScript\n- React" } }),
        { status: 200 }
      );
    }) as typeof fetch;

    const result = await runMatching(runId, emit, { fetchFn });

    assert.equal(fetchCalled, true);
    assert.equal(result.skipped, false);
    assert.ok(events.some((e) => e.type === "matching_start"));
    assert.ok(events.some((e) => e.type === "matching_complete"));
  });
});
