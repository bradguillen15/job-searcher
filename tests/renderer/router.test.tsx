import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { RouterProvider } from "react-router-dom";
import React from "react";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "dark";
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

describe("router", () => {
  it("uses createHashRouter and updates location hash on navigation", async () => {
    const routerSource = readFileSync(
      resolve(__dirname, "../../src/renderer/router.tsx"),
      "utf8"
    );
    expect(routerSource).toContain("createHashRouter");

    const { router } = await import("../../src/renderer/router");

    render(<RouterProvider router={router} />);

    expect(router.state.location.pathname).toBe("/");

    await router.navigate("/results");

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/results");
    });
  });
});
