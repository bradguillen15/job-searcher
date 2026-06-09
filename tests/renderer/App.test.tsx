import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

beforeEach(() => {
  vi.stubGlobal("api", {
    invoke: vi.fn().mockImplementation((channel: string) => {
      if (channel === "profiles:list") {
        return Promise.resolve([{ id: "p1", name: "Default", active: true }]);
      }
      if (channel === "db:query") {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    }),
    on: vi.fn(() => () => undefined),
  });
  Object.defineProperty(window, "api", {
    configurable: true,
    value: {
      invoke: vi.fn().mockImplementation((channel: string) => {
        if (channel === "profiles:list") {
          return Promise.resolve([{ id: "p1", name: "Default", active: true }]);
        }
        if (channel === "db:query") {
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      }),
      on: vi.fn(() => () => undefined),
    },
  });
});

describe("App", () => {
  it("mounts without throwing", async () => {
    const { default: App } = await import("../../src/renderer/App");
    expect(() => render(<App />)).not.toThrow();
  });
});
