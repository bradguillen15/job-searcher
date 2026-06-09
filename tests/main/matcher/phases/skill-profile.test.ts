import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { db, openDatabase } from "../../../../src/main/db.js";
import type { AiBackend } from "../../../../src/main/matcher/backends/types.js";
import { runSkillProfilePhase } from "../../../../src/main/matcher/phases/skill-profile.js";
import type { ProgressEvent } from "../../../../src/main/scraper/types.js";

function mockBackend(response: string | Error): AiBackend {
  return {
    name: "ollama",
    complete: async () => {
      if (response instanceof Error) {
        throw response;
      }
      return response;
    },
  };
}

describe("skill-profile phase", () => {
  const events: ProgressEvent[] = [];
  const emit = (event: ProgressEvent) => {
    events.push(event);
  };

  beforeEach(() => {
    openDatabase(":memory:");
    events.length = 0;
  });

  it("uses cached skill_profile without calling backend", async () => {
    db.prepare(
      "INSERT INTO resume (filename, raw_text, skill_profile) VALUES (?, ?, ?)"
    ).run("cv.pdf", "raw", "Cached skills");

    let called = false;
    const backend: AiBackend = {
      name: "ollama",
      complete: async () => {
        called = true;
        return "new";
      },
    };

    const result = await runSkillProfilePhase(backend, emit);

    assert.ok("profile" in result);
    if ("profile" in result) {
      assert.equal(result.profile, "Cached skills");
    }
    assert.equal(called, false);
    assert.ok(events.some((e) => e.type === "matching_phase" && e.status === "cached"));
  });

  it("generates and persists skill profile on cache miss", async () => {
    const insert = db
      .prepare("INSERT INTO resume (filename, raw_text) VALUES (?, ?)")
      .run("cv.pdf", "Engineer with TypeScript");
    const resumeId = Number(insert.lastInsertRowid);

    const result = await runSkillProfilePhase(
      mockBackend("- TypeScript\n- React"),
      emit
    );

    assert.ok("profile" in result);
    const row = db
      .prepare("SELECT skill_profile FROM resume WHERE id = ?")
      .get(resumeId) as { skill_profile: string };
    assert.equal(row.skill_profile, "- TypeScript\n- React");
  });

  it("returns error on empty backend response", async () => {
    db.prepare("INSERT INTO resume (filename, raw_text) VALUES (?, ?)").run(
      "cv.pdf",
      "text"
    );

    const result = await runSkillProfilePhase(mockBackend("   "), emit);

    assert.ok("error" in result);
    assert.ok(events.some((e) => e.type === "log"));
  });

  it("returns error when backend throws", async () => {
    db.prepare("INSERT INTO resume (filename, raw_text) VALUES (?, ?)").run(
      "cv.pdf",
      "text"
    );

    const result = await runSkillProfilePhase(
      mockBackend(new Error("network down")),
      emit
    );

    assert.ok("error" in result);
  });
});
