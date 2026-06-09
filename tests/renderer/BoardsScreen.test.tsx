import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import BoardsScreen from "../../src/renderer/screens/BoardsScreen";
import type { Board } from "../../src/renderer/types/board";
import type { Keyword } from "../../src/renderer/types/keyword";

const mockInvoke = vi.fn();

const sampleBoard: Board = {
  id: 1,
  name: "Indeed",
  url: "https://indeed.com",
  search_selector: "#search",
  created_at: "2026-06-08T12:00:00.000Z",
};

const sampleKeyword: Keyword = {
  id: 1,
  keyword: "typescript",
  active: 1,
  created_at: "2026-06-08T12:00:00.000Z",
};

function mockListQueries(boards: Board[], keywords: Keyword[] = []): void {
  mockInvoke.mockImplementation((channel: string, payload?: { sql: string }) => {
    if (channel !== "db:query") {
      return Promise.reject(new Error("unexpected channel"));
    }
    if (
      payload?.sql.includes("FROM boards") &&
      payload?.sql.includes("ORDER BY name ASC")
    ) {
      return Promise.resolve(boards);
    }
    if (
      payload?.sql.includes("FROM keywords") &&
      payload?.sql.includes("ORDER BY keyword ASC")
    ) {
      return Promise.resolve(keywords);
    }
    return Promise.reject(new Error(`unexpected sql: ${payload?.sql}`));
  });
}

function handleListQueries(
  payload: { sql: string; params?: unknown[] },
  boards: Board[],
  keywords: Keyword[]
): Promise<unknown> | null {
  if (
    payload.sql.includes("FROM boards") &&
    payload.sql.includes("ORDER BY name ASC")
  ) {
    return Promise.resolve(boards);
  }
  if (
    payload.sql.includes("FROM keywords") &&
    payload.sql.includes("ORDER BY keyword ASC")
  ) {
    return Promise.resolve(keywords);
  }
  return null;
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
    mockListQueries([]);

    render(<BoardsScreen />);

    expect(
      await screen.findByText(
        "No boards yet. Add a board to start tracking job listings."
      )
    ).toBeTruthy();
  });

  it("renders board rows with name, url, and selector", async () => {
    mockListQueries([sampleBoard]);

    render(<BoardsScreen />);

    expect(await screen.findByText("Indeed")).toBeTruthy();
    expect(screen.getByText("https://indeed.com")).toBeTruthy();
    expect(screen.getByText("#search")).toBeTruthy();
  });

  it("shows dash placeholder when search_selector is null", async () => {
    mockListQueries([
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
    let keywords: Keyword[] = [];

    mockInvoke.mockImplementation(
      (channel: string, payload?: { sql: string; params: unknown[] }) => {
        if (channel !== "db:query" || !payload) {
          return Promise.reject(new Error("unexpected"));
        }

        const listResult = handleListQueries(payload, boards, keywords);
        if (listResult !== null) {
          return listResult;
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

        if (payload.sql.includes("FROM boards WHERE id = ?")) {
          const id = payload.params[0] as number;
          const board = boards.find((row) => row.id === id);
          return Promise.resolve(board ? [board] : []);
        }

        return Promise.reject(new Error(`unexpected sql: ${payload.sql}`));
      }
    );

    render(<BoardsScreen />);
    await screen.findByText(
      "No boards yet. Add a board to start tracking job listings."
    );

    await user.click(screen.getByRole("button", { name: "Add board" }));
    await user.type(screen.getByLabelText("Name"), "Glassdoor");
    await user.type(screen.getByLabelText("URL"), "https://glassdoor.com");
    await user.click(
      screen.getByRole("button", { name: "Add board", hidden: false })
    );

    expect(await screen.findByText("Glassdoor")).toBeTruthy();
    expect(screen.getByText("https://glassdoor.com")).toBeTruthy();
  });

  it("edit flow updates row", async () => {
    const user = userEvent.setup();
    let boards: Board[] = [sampleBoard];
    const keywords: Keyword[] = [];

    mockInvoke.mockImplementation(
      (channel: string, payload?: { sql: string; params: unknown[] }) => {
        if (channel !== "db:query" || !payload) {
          return Promise.reject(new Error("unexpected"));
        }

        const listResult = handleListQueries(payload, boards, keywords);
        if (listResult !== null) {
          return listResult;
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
      }
    );

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
    const keywords: Keyword[] = [];

    mockInvoke.mockImplementation(
      (channel: string, payload?: { sql: string; params: unknown[] }) => {
        if (channel !== "db:query" || !payload) {
          return Promise.reject(new Error("unexpected"));
        }

        const listResult = handleListQueries(payload, boards, keywords);
        if (listResult !== null) {
          return listResult;
        }

        if (payload.sql.startsWith("DELETE FROM boards")) {
          boards = [];
          return Promise.resolve({ changes: 1, lastInsertRowid: 0 });
        }

        return Promise.reject(new Error(`unexpected sql: ${payload.sql}`));
      }
    );

    render(<BoardsScreen />);
    await screen.findByText("Indeed");

    const boardRow = screen.getByText("Indeed").closest("li");
    expect(boardRow).toBeTruthy();
    await user.click(
      within(boardRow as HTMLElement).getByRole("button", { name: "Delete" })
    );
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.queryByText("Indeed")).toBeNull();
    });
    expect(
      await screen.findByText(
        "No boards yet. Add a board to start tracking job listings."
      )
    ).toBeTruthy();
  });

  it("validation blocks empty submit", async () => {
    const user = userEvent.setup();
    mockListQueries([]);

    render(<BoardsScreen />);
    await screen.findByText(
      "No boards yet. Add a board to start tracking job listings."
    );

    await user.click(screen.getByRole("button", { name: "Add board" }));
    await user.click(
      screen.getByRole("button", { name: "Add board", hidden: false })
    );

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("Name and URL are required.");
    expect(mockInvoke).toHaveBeenCalledTimes(2);
  });

  it("duplicate URL shows error", async () => {
    const user = userEvent.setup();
    mockListQueries([]);

    mockInvoke.mockImplementation(
      (channel: string, payload?: { sql: string; params: unknown[] }) => {
        if (channel !== "db:query" || !payload) {
          return Promise.reject(new Error("unexpected"));
        }

        const listResult = handleListQueries(payload, [], []);
        if (listResult !== null) {
          return listResult;
        }

        if (payload.sql.startsWith("INSERT INTO boards")) {
          return Promise.resolve({
            error: "UNIQUE constraint failed: boards.url",
          });
        }

        return Promise.reject(new Error(`unexpected sql: ${payload.sql}`));
      }
    );

    render(<BoardsScreen />);
    await screen.findByText(
      "No boards yet. Add a board to start tracking job listings."
    );

    await user.click(screen.getByRole("button", { name: "Add board" }));
    await user.type(screen.getByLabelText("Name"), "Dup");
    await user.type(screen.getByLabelText("URL"), "https://dup.example");
    await user.click(
      screen.getByRole("button", { name: "Add board", hidden: false })
    );

    expect(
      await screen.findByText("A board with this URL already exists.")
    ).toBeTruthy();
  });

  it("FK delete shows error and keeps board", async () => {
    const user = userEvent.setup();
    mockListQueries([sampleBoard]);

    mockInvoke.mockImplementation(
      (channel: string, payload?: { sql: string; params: unknown[] }) => {
        if (channel !== "db:query" || !payload) {
          return Promise.reject(new Error("unexpected"));
        }

        const listResult = handleListQueries(payload, [sampleBoard], []);
        if (listResult !== null) {
          return listResult;
        }

        if (payload.sql.startsWith("DELETE FROM boards")) {
          return Promise.resolve({ error: "FOREIGN KEY constraint failed" });
        }

        return Promise.reject(new Error(`unexpected sql: ${payload.sql}`));
      }
    );

    render(<BoardsScreen />);
    await screen.findByText("Indeed");

    const boardRow = screen.getByText("Indeed").closest("li");
    await user.click(
      within(boardRow as HTMLElement).getByRole("button", { name: "Delete" })
    );
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(
      await screen.findByText(
        "Cannot delete this board while jobs reference it."
      )
    ).toBeTruthy();
    expect(screen.getByText("Indeed")).toBeTruthy();
  });

  it("renders url and selector with font-mono", async () => {
    mockListQueries([sampleBoard]);

    render(<BoardsScreen />);

    await screen.findByText("Indeed");
    expect(screen.getByText("https://indeed.com").className).toContain(
      "font-mono"
    );
    expect(screen.getByText("#search").className).toContain("font-mono");
  });

  describe("keywords", () => {
    it("shows keywords empty state when no keywords exist", async () => {
      mockListQueries([], []);

      render(<BoardsScreen />);

      expect(
        await screen.findByText(
          "No keywords yet. Add a keyword to refine job searches."
        )
      ).toBeTruthy();
    });

    it("renders keyword rows with text and active switch", async () => {
      mockListQueries([], [sampleKeyword]);

      render(<BoardsScreen />);

      expect(await screen.findByText("typescript")).toBeTruthy();
      expect(
        screen.getByRole("switch", { name: "Toggle typescript active" })
      ).toBeTruthy();
    });

    it("add flow inserts and shows new keyword", async () => {
      const user = userEvent.setup();
      let keywords: Keyword[] = [];

      mockInvoke.mockImplementation(
        (channel: string, payload?: { sql: string; params: unknown[] }) => {
          if (channel !== "db:query" || !payload) {
            return Promise.reject(new Error("unexpected"));
          }

          const listResult = handleListQueries(payload, [], keywords);
          if (listResult !== null) {
            return listResult;
          }

          if (payload.sql.startsWith("INSERT INTO keywords")) {
            const newKeyword: Keyword = {
              id: 2,
              keyword: payload.params[0] as string,
              active: 1,
              created_at: "2026-06-08T13:00:00.000Z",
            };
            keywords = [...keywords, newKeyword];
            return Promise.resolve({ changes: 1, lastInsertRowid: 2 });
          }

          if (payload.sql.includes("FROM keywords WHERE id = ?")) {
            const id = payload.params[0] as number;
            const keyword = keywords.find((row) => row.id === id);
            return Promise.resolve(keyword ? [keyword] : []);
          }

          return Promise.reject(new Error(`unexpected sql: ${payload.sql}`));
        }
      );

      render(<BoardsScreen />);
      await screen.findByText(
        "No keywords yet. Add a keyword to refine job searches."
      );

      await user.click(screen.getByRole("button", { name: "Add keyword" }));
      await user.type(screen.getByLabelText("Keyword"), "react");
      await user.click(
        screen.getByRole("button", { name: "Add keyword", hidden: false })
      );

      expect(await screen.findByText("react")).toBeTruthy();
    });

    it("toggle switches active state", async () => {
      const user = userEvent.setup();
      let keywords: Keyword[] = [sampleKeyword];

      mockInvoke.mockImplementation(
        (channel: string, payload?: { sql: string; params: unknown[] }) => {
          if (channel !== "db:query" || !payload) {
            return Promise.reject(new Error("unexpected"));
          }

          const listResult = handleListQueries(payload, [], keywords);
          if (listResult !== null) {
            return listResult;
          }

          if (payload.sql.startsWith("UPDATE keywords SET active")) {
            keywords = [
              {
                ...sampleKeyword,
                active: payload.params[0] as number,
              },
            ];
            return Promise.resolve({ changes: 1, lastInsertRowid: 0 });
          }

          return Promise.reject(new Error(`unexpected sql: ${payload.sql}`));
        }
      );

      render(<BoardsScreen />);
      await screen.findByText("typescript");

      const toggle = screen.getByRole("switch", {
        name: "Toggle typescript active",
      });
      expect(toggle.getAttribute("aria-checked")).toBe("true");

      await user.click(toggle);

      await waitFor(() => {
        expect(toggle.getAttribute("aria-checked")).toBe("false");
      });
    });

    it("delete confirm removes keyword row", async () => {
      const user = userEvent.setup();
      let keywords: Keyword[] = [sampleKeyword];

      mockInvoke.mockImplementation(
        (channel: string, payload?: { sql: string; params: unknown[] }) => {
          if (channel !== "db:query" || !payload) {
            return Promise.reject(new Error("unexpected"));
          }

          const listResult = handleListQueries(payload, [], keywords);
          if (listResult !== null) {
            return listResult;
          }

          if (payload.sql.startsWith("DELETE FROM keywords")) {
            keywords = [];
            return Promise.resolve({ changes: 1, lastInsertRowid: 0 });
          }

          return Promise.reject(new Error(`unexpected sql: ${payload.sql}`));
        }
      );

      render(<BoardsScreen />);
      await screen.findByText("typescript");

      const keywordRow = screen.getByText("typescript").closest("li");
      await user.click(
        within(keywordRow as HTMLElement).getByRole("button", {
          name: "Delete",
        })
      );
      const dialog = await screen.findByRole("alertdialog");
      await user.click(within(dialog).getByRole("button", { name: "Delete" }));

      await waitFor(() => {
        expect(screen.queryByText("typescript")).toBeNull();
      });
      expect(
        await screen.findByText(
          "No keywords yet. Add a keyword to refine job searches."
        )
      ).toBeTruthy();
    });

    it("validation blocks empty keyword submit", async () => {
      const user = userEvent.setup();
      mockListQueries([], []);

      render(<BoardsScreen />);
      await screen.findByText(
        "No keywords yet. Add a keyword to refine job searches."
      );

      await user.click(screen.getByRole("button", { name: "Add keyword" }));
      await user.click(
        screen.getByRole("button", { name: "Add keyword", hidden: false })
      );

      const alert = await screen.findByRole("alert");
      expect(alert.textContent).toBe("Keyword is required.");
      expect(mockInvoke).toHaveBeenCalledTimes(2);
    });

    it("duplicate keyword shows error", async () => {
      const user = userEvent.setup();
      mockListQueries([], []);

      mockInvoke.mockImplementation(
        (channel: string, payload?: { sql: string; params: unknown[] }) => {
          if (channel !== "db:query" || !payload) {
            return Promise.reject(new Error("unexpected"));
          }

          const listResult = handleListQueries(payload, [], []);
          if (listResult !== null) {
            return listResult;
          }

          if (payload.sql.startsWith("INSERT INTO keywords")) {
            return Promise.resolve({
              error: "UNIQUE constraint failed: keywords.keyword",
            });
          }

          return Promise.reject(new Error(`unexpected sql: ${payload.sql}`));
        }
      );

      render(<BoardsScreen />);
      await screen.findByText(
        "No keywords yet. Add a keyword to refine job searches."
      );

      await user.click(screen.getByRole("button", { name: "Add keyword" }));
      await user.type(screen.getByLabelText("Keyword"), "dup");
      await user.click(
        screen.getByRole("button", { name: "Add keyword", hidden: false })
      );

      expect(
        await screen.findByText("A keyword with this text already exists.")
      ).toBeTruthy();
    });

    it("FK delete shows error and keeps keyword", async () => {
      const user = userEvent.setup();
      mockListQueries([], [sampleKeyword]);

      mockInvoke.mockImplementation(
        (channel: string, payload?: { sql: string; params: unknown[] }) => {
          if (channel !== "db:query" || !payload) {
            return Promise.reject(new Error("unexpected"));
          }

          const listResult = handleListQueries(payload, [], [sampleKeyword]);
          if (listResult !== null) {
            return listResult;
          }

          if (payload.sql.startsWith("DELETE FROM keywords")) {
            return Promise.resolve({ error: "FOREIGN KEY constraint failed" });
          }

          return Promise.reject(new Error(`unexpected sql: ${payload.sql}`));
        }
      );

      render(<BoardsScreen />);
      await screen.findByText("typescript");

      const keywordRow = screen.getByText("typescript").closest("li");
      await user.click(
        within(keywordRow as HTMLElement).getByRole("button", {
          name: "Delete",
        })
      );
      const dialog = await screen.findByRole("alertdialog");
      await user.click(within(dialog).getByRole("button", { name: "Delete" }));

      expect(
        await screen.findByText(
          "Cannot delete this keyword while jobs reference it."
        )
      ).toBeTruthy();
      expect(screen.getByText("typescript")).toBeTruthy();
    });

    it("renders inactive keyword with muted styling", async () => {
      mockListQueries([], [{ ...sampleKeyword, active: 0 }]);

      render(<BoardsScreen />);

      const keywordText = await screen.findByText("typescript");
      expect(keywordText.className).toContain("text-muted-foreground");
    });
  });
});
