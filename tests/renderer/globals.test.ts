import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

describe("globals.css", () => {
  it("defines --font-sans as Inter and --font-mono as JetBrains Mono", () => {
    const css = readFileSync(
      resolve(__dirname, "../../src/renderer/styles/globals.css"),
      "utf8"
    );

    expect(css).toContain('@import "@fontsource/inter/400.css"');
    expect(css).toContain('@import "@fontsource/jetbrains-mono/400.css"');
    expect(css).toContain('--font-sans: "Inter", sans-serif');
    expect(css).toContain('--font-mono: "JetBrains Mono", monospace');
    expect(css).toContain("font-family: var(--font-mono)");
  });
});
