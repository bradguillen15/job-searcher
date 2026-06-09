import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

import { openDatabase } from "../../src/main/db.js";
import {
  readAndExtractFromPath,
  upsertResumeRow,
  uploadResume,
} from "../../src/main/resume.js";

const FIXTURES_DIR = path.join(
  import.meta.dirname,
  "..",
  "fixtures",
  "resume"
);

describe("readAndExtractFromPath", () => {
  it("reads and extracts text from TXT fixture path", async () => {
    const filePath = path.join(FIXTURES_DIR, "sample.txt");
    const text = await readAndExtractFromPath(filePath);
    assert.equal(text, "Software engineer with TypeScript experience.");
  });

  it("reads and extracts text from PDF fixture path", async () => {
    const filePath = path.join(FIXTURES_DIR, "sample.pdf");
    const text = await readAndExtractFromPath(filePath);
    assert.match(text, /Experienced full-stack engineer resume text/);
  });

  it("throws ResumeExtractError for unsupported extension", async () => {
    const tempDir = fs.mkdtempSync(path.join(import.meta.dirname, "resume-test-"));
    const filePath = path.join(tempDir, "legacy.doc");
    fs.writeFileSync(filePath, "binary doc content");

    await assert.rejects(
      () => readAndExtractFromPath(filePath),
      (err: unknown) => {
        assert.match((err as Error).message, /Unsupported file type/);
        return true;
      }
    );

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});

describe("upsertResumeRow", () => {
  it("replaces existing resume row with NULL skill_profile and ISO updated_at", () => {
    const database = openDatabase(":memory:");

    const first = upsertResumeRow(database, "first.pdf", "First resume text");
    assert.equal(first.filename, "first.pdf");
    assert.equal(first.skill_profile, null);
    assert.equal(first.current_company, null);
    assert.equal(first.current_salary, null);
    assert.equal(first.target_salary, null);
    assert.equal(first.search_mode, null);
    assert.ok(first.updated_at.endsWith("Z"));

    const second = upsertResumeRow(
      database,
      "second.docx",
      "Second resume text"
    );
    assert.equal(second.filename, "second.docx");
    assert.equal(second.skill_profile, null);

    const count = database
      .prepare("SELECT COUNT(*) AS count FROM resume")
      .get() as { count: number };
    assert.equal(count.count, 1);

    const row = database
      .prepare("SELECT filename FROM resume")
      .get() as { filename: string };
    assert.equal(row.filename, "second.docx");

    database.close();
  });
});

describe("uploadResume", () => {
  it("returns cancelled when dialog is cancelled", async () => {
    const database = openDatabase(":memory:");

    const result = await uploadResume({
      database,
      showOpenDialog: async () => ({ canceled: true, filePaths: [] }),
    });

    assert.deepEqual(result, { cancelled: true });

    const count = database
      .prepare("SELECT COUNT(*) AS count FROM resume")
      .get() as { count: number };
    assert.equal(count.count, 0);

    database.close();
  });

  it("persists resume when dialog returns fixture path", async () => {
    const database = openDatabase(":memory:");
    const filePath = path.join(FIXTURES_DIR, "sample.txt");

    const result = await uploadResume({
      database,
      showOpenDialog: async () => ({
        canceled: false,
        filePaths: [filePath],
      }),
    });

    assert.ok("resume" in result);
    if (!("resume" in result)) {
      return;
    }

    assert.equal(result.resume.filename, "sample.txt");
    assert.equal(
      result.resume.raw_text,
      "Software engineer with TypeScript experience."
    );
    assert.equal(result.resume.skill_profile, null);

    database.close();
  });
});

describe("fixture files exist", () => {
  it("includes committed resume fixtures", () => {
    for (const name of ["sample.pdf", "sample.docx", "sample.txt", "empty.pdf"]) {
      assert.ok(fs.existsSync(path.join(FIXTURES_DIR, name)), `missing ${name}`);
    }
  });
});
