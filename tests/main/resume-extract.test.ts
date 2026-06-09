import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

import {
  ResumeExtractError,
  extractTextFromBuffer,
} from "../../src/main/resume-extract.js";

const FIXTURES_DIR = path.join(
  import.meta.dirname,
  "..",
  "fixtures",
  "resume"
);

describe("extractTextFromBuffer", () => {
  it("extracts text from PDF fixture", async () => {
    const buffer = fs.readFileSync(path.join(FIXTURES_DIR, "sample.pdf"));
    const text = await extractTextFromBuffer(buffer, "pdf");
    assert.match(text, /Experienced full-stack engineer resume text/);
  });

  it("extracts text from DOCX fixture", async () => {
    const buffer = fs.readFileSync(path.join(FIXTURES_DIR, "sample.docx"));
    const text = await extractTextFromBuffer(buffer, "docx");
    assert.match(text, /Senior developer with React and Node experience/);
  });

  it("extracts text from TXT fixture", async () => {
    const buffer = fs.readFileSync(path.join(FIXTURES_DIR, "sample.txt"));
    const text = await extractTextFromBuffer(buffer, "txt");
    assert.equal(text, "Software engineer with TypeScript experience.");
  });

  it("throws ResumeExtractError for empty PDF", async () => {
    const buffer = fs.readFileSync(path.join(FIXTURES_DIR, "empty.pdf"));

    await assert.rejects(
      () => extractTextFromBuffer(buffer, "pdf"),
      (err: unknown) => {
        assert.ok(err instanceof ResumeExtractError);
        assert.match(
          (err as ResumeExtractError).message,
          /No text could be extracted/
        );
        return true;
      }
    );
  });

  it("throws ResumeExtractError for whitespace-only TXT", async () => {
    const buffer = Buffer.from("   \n\t  ");

    await assert.rejects(
      () => extractTextFromBuffer(buffer, "txt"),
      (err: unknown) => {
        assert.ok(err instanceof ResumeExtractError);
        assert.match(
          (err as ResumeExtractError).message,
          /No text could be extracted/
        );
        return true;
      }
    );
  });
});

describe("ResumeExtractError", () => {
  it("has correct name property", () => {
    const err = new ResumeExtractError("test");
    assert.equal(err.name, "ResumeExtractError");
  });
});
