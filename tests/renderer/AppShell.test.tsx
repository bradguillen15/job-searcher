import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import AppShell from "../../src/renderer/components/AppShell";
import ScoutScreen from "../../src/renderer/screens/ScoutScreen";
import ResultsScreen from "../../src/renderer/screens/ResultsScreen";
import PipelineScreen from "../../src/renderer/screens/PipelineScreen";
import BoardsScreen from "../../src/renderer/screens/BoardsScreen";
import ResumeScreen from "../../src/renderer/screens/ResumeScreen";
import SettingsScreen from "../../src/renderer/screens/SettingsScreen";

const mockInvoke = vi.fn();

function createTestRouter(initialPath = "/"): ReturnType<typeof createMemoryRouter> {
  return createMemoryRouter(
    [
      {
        path: "/",
        element: <AppShell />,
        children: [
          { index: true, element: <ScoutScreen /> },
          { path: "results", element: <ResultsScreen /> },
          { path: "pipeline", element: <PipelineScreen /> },
          { path: "boards", element: <BoardsScreen /> },
          { path: "resume", element: <ResumeScreen /> },
          { path: "settings", element: <SettingsScreen /> },
        ],
      },
    ],
    { initialEntries: [initialPath] }
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "dark";
  mockInvoke.mockImplementation((channel: string, payload?: { sql?: string }) => {
    if (channel === "profiles:list") {
      return Promise.resolve([{ id: "p1", name: "Default", active: true }]);
    }
    if (channel === "db:query") {
      if (payload?.sql?.includes("FROM boards")) {
        return Promise.resolve([]);
      }
      if (payload?.sql?.includes("FROM settings")) {
        return Promise.resolve([]);
      }
      if (payload?.sql?.includes("FROM runs")) {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    }
    return Promise.reject(new Error("unexpected invoke"));
  });
  Object.defineProperty(window, "api", {
    configurable: true,
    value: {
      invoke: mockInvoke,
      on: vi.fn(() => () => undefined),
    },
  });
});

describe("AppShell", () => {
  it("renders all six nav items", async () => {
    const router = createTestRouter();
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("link", { name: "Scout" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Results" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Pipeline" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Boards & Keywords" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Resume" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Settings" })).toBeTruthy();
  });

  it("places Settings in bottom group separated from main nav", async () => {
    const router = createTestRouter();
    const { container } = render(<RouterProvider router={router} />);

    await screen.findByRole("link", { name: "Scout" });

    const settingsLink = screen.getByRole("link", { name: "Settings" });
    const scoutLink = screen.getByRole("link", { name: "Scout" });

    let parent: HTMLElement | null = settingsLink.parentElement;
    let bottomGroup: HTMLElement | null = null;
    while (parent && parent !== container) {
      if (parent.className.includes("border-t")) {
        bottomGroup = parent;
        break;
      }
      parent = parent.parentElement;
    }

    expect(bottomGroup).toBeTruthy();
    expect(bottomGroup?.contains(settingsLink)).toBe(true);
    expect(bottomGroup?.contains(scoutLink)).toBe(false);
    expect(
      bottomGroup?.querySelector('[aria-label*="theme"]')
    ).toBeTruthy();
  });

  it("renders icon alongside label for each nav item", async () => {
    const router = createTestRouter();
    render(<RouterProvider router={router} />);

    const labels = [
      "Scout",
      "Results",
      "Pipeline",
      "Boards & Keywords",
      "Resume",
      "Settings",
    ];

    for (const label of labels) {
      const link = await screen.findByRole("link", { name: label });
      expect(link.querySelector('svg[aria-hidden="true"]')).toBeTruthy();
    }
  });

  it("updates active highlight when clicking nav items", async () => {
    const user = userEvent.setup();
    const router = createTestRouter();
    render(<RouterProvider router={router} />);

    const resultsLink = await screen.findByRole("link", { name: "Results" });
    await user.click(resultsLink);

    expect(resultsLink.className).toContain("text-accent");
    expect(screen.getByRole("link", { name: "Scout" }).className).not.toContain(
      "text-accent"
    );
  });

  it("shows screen content for each route", async () => {
    const user = userEvent.setup();
    const routes: Array<{ link: string; matcher: () => Promise<void> }> = [
      {
        link: "Scout",
        matcher: async () => {
          expect(await screen.findByRole("heading", { name: "Scout" })).toBeTruthy();
        },
      },
      {
        link: "Results",
        matcher: async () => {
          expect(await screen.findByText("Results screen")).toBeTruthy();
        },
      },
      {
        link: "Pipeline",
        matcher: async () => {
          expect(await screen.findByText("Pipeline screen")).toBeTruthy();
        },
      },
      {
        link: "Boards & Keywords",
        matcher: async () => {
          expect(
            await screen.findByText(
              "No boards yet. Add a board to start tracking job listings."
            )
          ).toBeTruthy();
        },
      },
      {
        link: "Resume",
        matcher: async () => {
          expect(
            await screen.findByRole("button", { name: "Upload resume" })
          ).toBeTruthy();
        },
      },
      {
        link: "Settings",
        matcher: async () => {
          expect(await screen.findByText("Settings screen")).toBeTruthy();
        },
      },
    ];

    const router = createTestRouter();
    render(<RouterProvider router={router} />);

    for (const route of routes) {
      if (route.link !== "Scout") {
        await user.click(await screen.findByRole("link", { name: route.link }));
      }
      await route.matcher();
    }
  });
});
