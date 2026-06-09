import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export class ResumeExtractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeExtractError";
  }
}

export type ResumeExtension = "pdf" | "docx" | "txt";

export async function extractTextFromBuffer(
  buffer: Buffer,
  extension: ResumeExtension
): Promise<string> {
  let text: string;

  switch (extension) {
    case "pdf": {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText({ pageJoiner: "" });
      text = result.text;
      break;
    }
    case "docx": {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
      break;
    }
    case "txt": {
      text = buffer.toString("utf-8");
      break;
    }
    default:
      throw new ResumeExtractError(
        "Unsupported file type. Use PDF, DOCX, or TXT."
      );
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new ResumeExtractError("No text could be extracted from this file.");
  }

  return trimmed;
}
