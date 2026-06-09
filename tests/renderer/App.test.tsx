import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

beforeEach(() => {
  vi.stubGlobal("api", {
    invoke: vi.fn().mockResolvedValue([{ id: "p1", name: "Default", active: true }]),
  });
  Object.defineProperty(window, "api", {
    configurable: true,
    value: {
      invoke: vi.fn().mockResolvedValue([{ id: "p1", name: "Default", active: true }]),
    },
  });
});

describe("App", () => {
  it("mounts without throwing", async () => {
    const { default: App } = await import("../../src/renderer/App");
    expect(() => render(<App />)).not.toThrow();
  });
});
