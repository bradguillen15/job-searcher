import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, it, expect } from "vitest";

const FORBIDDEN_PATTERNS: RegExp[] = [
  /\.module\.css/,
  /from\s+["']styled-components["']/,
  /from\s+["']@emotion\/styled["']/,
  /from\s+["']@emotion\/react["']/,
  /\bcss`/,
];

function collectSourceFiles(dir: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
      continue;
    }
    if (/\.tsx?$/.test(entry)) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("results-screen styling", () => {
  it("uses Tailwind and shadcn only; no CSS Modules or CSS-in-JS", () => {
    const rendererRoot = resolve(__dirname, "../../src/renderer");
    const files = [
      ...collectSourceFiles(join(rendererRoot, "components/results")),
      ...collectSourceFiles(join(rendererRoot, "components/pipeline")),
      join(rendererRoot, "screens/ResultsScreen.tsx"),
      join(rendererRoot, "screens/PipelineScreen.tsx"),
    ];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const pattern of FORBIDDEN_PATTERNS) {
        expect(source, file).not.toMatch(pattern);
      }
    }
  });
});
