import { dialog } from "electron";
import fs from "fs";
import path from "path";
import type Database from "better-sqlite3";
import { db } from "./db";
import {
  extractTextFromBuffer,
  ResumeExtractError,
  type ResumeExtension,
} from "./resume-extract";

export type ResumeUploadResult =
  | { cancelled: true }
  | { resume: ResumeRow }
  | { error: string };

export interface ResumeRow {
  id: number;
  filename: string;
  raw_text: string;
  skill_profile: string | null;
  current_company: string | null;
  current_salary: number | null;
  target_salary: number | null;
  search_mode: string | null;
  updated_at: string;
}

const INSERT_SQL = `
INSERT INTO resume (
  filename, raw_text, skill_profile, current_company,
  current_salary, target_salary, search_mode, updated_at
) VALUES (?, ?, NULL, NULL, NULL, NULL, NULL, ?)
`;

const SELECT_BY_ID_SQL = `
SELECT id, filename, raw_text, skill_profile, current_company,
  current_salary, target_salary, search_mode, updated_at
FROM resume WHERE id = ?
`;

export function parseExtension(filePath: string): ResumeExtension | null {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  if (ext === "pdf" || ext === "docx" || ext === "txt") {
    return ext;
  }
  return null;
}

export async function readAndExtractFromPath(filePath: string): Promise<string> {
  const extension = parseExtension(filePath);
  if (extension === null) {
    throw new ResumeExtractError(
      "Unsupported file type. Use PDF, DOCX, or TXT."
    );
  }

  const buffer = fs.readFileSync(filePath);
  return extractTextFromBuffer(buffer, extension);
}

export function upsertResumeRow(
  database: Database.Database,
  filename: string,
  rawText: string
): ResumeRow {
  const updatedAt = new Date().toISOString();

  const replace = database.transaction(() => {
    database.prepare("DELETE FROM resume").run();
    const result = database.prepare(INSERT_SQL).run(filename, rawText, updatedAt);
    return Number(result.lastInsertRowid);
  });

  const id = replace();
  const row = database
    .prepare(SELECT_BY_ID_SQL)
    .get(id) as ResumeRow | undefined;

  if (!row) {
    throw new Error("Failed to load inserted resume row");
  }

  return row;
}

export interface UploadResumeDeps {
  showOpenDialog?: (
    options: Electron.OpenDialogOptions
  ) => Promise<Electron.OpenDialogReturnValue>;
  readAndExtract?: (filePath: string) => Promise<string>;
  database?: Database.Database;
}

export async function uploadResume(
  deps?: UploadResumeDeps
): Promise<ResumeUploadResult> {
  const showOpenDialog =
    deps?.showOpenDialog ?? dialog.showOpenDialog.bind(dialog);
  const readExtract = deps?.readAndExtract ?? readAndExtractFromPath;
  const database = deps?.database ?? db;

  try {
    const result = await showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Resume", extensions: ["pdf", "docx", "txt"] }],
    });

    if (result.canceled || !result.filePaths[0]) {
      return { cancelled: true };
    }

    const filePath = result.filePaths[0];
    const rawText = await readExtract(filePath);
    const filename = path.basename(filePath);
    const resume = upsertResumeRow(database, filename, rawText);
    return { resume };
  } catch (err) {
    if (err instanceof ResumeExtractError) {
      return { error: err.message };
    }
    return { error: (err as Error).message };
  }
}
