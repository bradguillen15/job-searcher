import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import BoardsScreen from "../../src/renderer/screens/BoardsScreen";
import type { Board } from "../../src/renderer/types/board";

const mockInvoke = vi.fn();

const sampleBoard: Board = {
  id: 1,
  name: "Indeed",
  url: "https://indeed.com",
  search_selector: "#search",
  created_at: "2026-06-08T12:00:00.000Z",
};

function mockListBoards(boards: Board[]): void {
  mockInvoke.mockImplementation((channel: string, payload?: { sql: string }) => {
    if (channel !== "db:query") {
      return Promise.reject(new Error("unexpected channel"));
    }
    if (payload?.sql.includes("ORDER BY name ASC")) {
      return Promise.resolve(boards);
    }
    return Promise.reject(new Error(`unexpected sql: ${payload?.sql}`));
  });
}

beforeEach(() => {
  mockInvoke.mockReset();
  Object.defineProperty(window, "api", {
    configurable: true,
    value: { invoke: mockInvoke },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("BoardsScreen", () => {
  it("shows empty state when no boards exist", async () => {
    mockListBoards([]);

    render(<BoardsScreen />);

    expect(
      await screen.findByText("No boards yet. Add a board to start tracking job listings.")
    ).toBeTruthy();
  });

  it("renders board rows with name, url, and selector", async () => {
    mockListBoards([sampleBoard]);

    render(<BoardsScreen />);

    expect(await screen.findByText("Indeed")).toBeTruthy();
    expect(screen.getByText("https://indeed.com")).toBeTruthy();
    expect(screen.getByText("#search")).toBeTruthy();
  });

  it("shows dash placeholder when search_selector is null", async () => {
    mockListBoards([
      {
        ...sampleBoard,
        search_selector: null,
      },
    ]);

    render(<BoardsScreen />);

    await screen.findByText("Indeed");
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("add flow inserts and shows new board", async () => {
    const user = userEvent.setup();
    let boards: Board[] = [];

    mockInvoke.mockImplementation((channel: string, payload?: { sql: string; params: unknown[] }) => {
      if (channel !== "db:query" || !payload) {
        return Promise.reject(new Error("unexpected"));
      }

      if (payload.sql.includes("ORDER BY name ASC")) {
        return Promise.resolve(boards);
      }

      if (payload.sql.startsWith("INSERT INTO boards")) {
        const newBoard: Board = {
          id: 2,
          name: payload.params[0] as string,
          url: payload.params[1] as string,
          search_selector: payload.params[2] as string | null,
          created_at: "2026-06-08T13:00:00.000Z",
        };
        boards = [...boards, newBoard];
        return Promise.resolve({ changes: 1, lastInsertRowid: 2 });
      }

      if (payload.sql.includes("WHERE id = ?")) {
        const id = payload.params[0] as number;
        const board = boards.find((row) => row.id === id);
        return Promise.resolve(board ? [board] : []);
      }

      return Promise.reject(new Error(`unexpected sql: ${payload.sql}`));
    });

    render(<BoardsScreen />);
    await screen.findByText("No boards yet. Add a board to start tracking job listings.");

    await user.click(screen.getByRole("button", { name: "Add board" }));
    await user.type(screen.getByLabelText("Name"), "Glassdoor");
    await user.type(screen.getByLabelText("URL"), "https://glassdoor.com");
    await user.click(screen.getByRole("button", { name: "Add board", hidden: false }));

    expect(await screen.findByText("Glassdoor")).toBeTruthy();
    expect(screen.getByText("https://glassdoor.com")).toBeTruthy();
  });

  it("edit flow updates row", async () => {
    const user = userEvent.setup();
    let boards: Board[] = [sampleBoard];

    mockInvoke.mockImplementation((channel: string, payload?: { sql: string; params: unknown[] }) => {
      if (channel !== "db:query" || !payload) {
        return Promise.reject(new Error("unexpected"));
      }

      if (payload.sql.includes("ORDER BY name ASC")) {
        return Promise.resolve(boards);
      }

      if (payload.sql.startsWith("UPDATE boards")) {
        boards = [
          {
            ...sampleBoard,
            name: payload.params[0] as string,
            url: payload.params[1] as string,
            search_selector: payload.params[2] as string | null,
          },
        ];
        return Promise.resolve({ changes: 1, lastInsertRowid: 0 });
      }

      return Promise.reject(new Error(`unexpected sql: ${payload.sql}`));
    });

    render(<BoardsScreen />);
    await screen.findByText("Indeed");

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const nameInput = screen.getByLabelText("Name");
    await user.clear(nameInput);
    await user.type(nameInput, "Indeed Jobs");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Indeed Jobs")).toBeTruthy();
  });

  it("delete confirm removes row", async () => {
    const user = userEvent.setup();
    let boards: Board[] = [sampleBoard];

    mockInvoke.mockImplementation((channel: string, payload?: { sql: string; params: unknown[] }) => {
      if (channel !== "db:query" || !payload) {
        return Promise.reject(new Error("unexpected"));
      }

      if (payload.sql.includes("ORDER BY name ASC")) {
        return Promise.resolve(boards);
      }

      if (payload.sql.startsWith("DELETE FROM boards")) {
        boards = [];
        return Promise.resolve({ changes: 1, lastInsertRowid: 0 });
      }

      return Promise.reject(new Error(`unexpected sql: ${payload.sql}`));
    });

    render(<BoardsScreen />);
    await screen.findByText("Indeed");

    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.queryByText("Indeed")).toBeNull();
    });
    expect(
      await screen.findByText("No boards yet. Add a board to start tracking job listings.")
    ).toBeTruthy();
  });

  it("validation blocks empty submit", async () => {
    const user = userEvent.setup();
    mockListBoards([]);

    render(<BoardsScreen />);
    await screen.findByText("No boards yet. Add a board to start tracking job listings.");

    await user.click(screen.getByRole("button", { name: "Add board" }));
    await user.click(screen.getByRole("button", { name: "Add board", hidden: false }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("Name and URL are required.");
    expect(mockInvoke).toHaveBeenCalledTimes(1);
  });

  it("duplicate URL shows error", async () => {
    const user = userEvent.setup();
    mockListBoards([]);

    mockInvoke.mockImplementation((channel: string, payload?: { sql: string; params: unknown[] }) => {
      if (channel !== "db:query" || !payload) {
        return Promise.reject(new Error("unexpected"));
      }

      if (payload.sql.includes("ORDER BY name ASC")) {
        return Promise.resolve([]);
      }

      if (payload.sql.startsWith("INSERT INTO boards")) {
        return Promise.resolve({ error: "UNIQUE constraint failed: boards.url" });
      }

      return Promise.reject(new Error(`unexpected sql: ${payload.sql}`));
    });

    render(<BoardsScreen />);
    await screen.findByText("No boards yet. Add a board to start tracking job listings.");

    await user.click(screen.getByRole("button", { name: "Add board" }));
    await user.type(screen.getByLabelText("Name"), "Dup");
    await user.type(screen.getByLabelText("URL"), "https://dup.example");
    await user.click(screen.getByRole("button", { name: "Add board", hidden: false }));

    expect(await screen.findByText("A board with this URL already exists.")).toBeTruthy();
  });

  it("FK delete shows error and keeps board", async () => {
    const user = userEvent.setup();
    mockListBoards([sampleBoard]);

    mockInvoke.mockImplementation((channel: string, payload?: { sql: string; params: unknown[] }) => {
      if (channel !== "db:query" || !payload) {
        return Promise.reject(new Error("unexpected"));
      }

      if (payload.sql.includes("ORDER BY name ASC")) {
        return Promise.resolve([sampleBoard]);
      }

      if (payload.sql.startsWith("DELETE FROM boards")) {
        return Promise.resolve({ error: "FOREIGN KEY constraint failed" });
      }

      return Promise.reject(new Error(`unexpected sql: ${payload.sql}`));
    });

    render(<BoardsScreen />);
    await screen.findByText("Indeed");

    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(
      await screen.findByText("Cannot delete this board while jobs reference it.")
    ).toBeTruthy();
    expect(screen.getByText("Indeed")).toBeTruthy();
  });

  it("renders url and selector with font-mono", async () => {
    mockListBoards([sampleBoard]);

    render(<BoardsScreen />);

    await screen.findByText("Indeed");
    expect(screen.getByText("https://indeed.com").className).toContain("font-mono");
    expect(screen.getByText("#search").className).toContain("font-mono");
  });
});
