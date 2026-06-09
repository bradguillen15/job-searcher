import { describe, it, expect, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Initialize i18n before rendering components
beforeAll(async () => {
  const { default: i18n } = await import("../../src/renderer/i18n");
  await i18n.init();
});

describe("App", () => {
  it("mounts without throwing", async () => {
    const { default: App } = await import("../../src/renderer/App");
    expect(() => render(<App />)).not.toThrow();
  });

  it("renders app title from translations", async () => {
    const { default: App } = await import("../../src/renderer/App");
    render(<App />);
    expect(screen.getByText("Job Scout")).toBeTruthy();
  });
});
