import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  listBoards,
  createBoard,
  updateBoard,
  deleteBoard,
  mapDbError,
  normalizeSearchSelector,
  BoardsDbError,
} from "../../src/renderer/lib/boards-db";

const mockInvoke = vi.fn();

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

describe("boards-db", () => {
  describe("listBoards", () => {
    it("invokes db:query with list SQL and empty params", async () => {
      const boards = [
        {
          id: 1,
          name: "Indeed",
          url: "https://indeed.com",
          search_selector: "#search",
          created_at: "2026-06-08T12:00:00.000Z",
        },
      ];
      mockInvoke.mockResolvedValue(boards);

      const result = await listBoards();

      expect(mockInvoke).toHaveBeenCalledWith("db:query", {
        sql: "SELECT id, name, url, search_selector, created_at FROM boards ORDER BY name ASC",
        params: [],
      });
      expect(result).toEqual(boards);
    });

    it("throws BoardsDbError when db:query returns error", async () => {
      mockInvoke.mockResolvedValue({ error: "disk I/O error" });

      await expect(listBoards()).rejects.toThrow(BoardsDbError);
      await expect(listBoards()).rejects.toThrow("disk I/O error");
    });
  });

  describe("createBoard", () => {
    it("inserts with parameterized SQL and fetches new row", async () => {
      mockInvoke
        .mockResolvedValueOnce({ changes: 1, lastInsertRowid: 2 })
        .mockResolvedValueOnce([
          {
            id: 2,
            name: "LinkedIn",
            url: "https://linkedin.com/jobs",
            search_selector: null,
            created_at: "2026-06-08T12:00:00.000Z",
          },
        ]);

      const result = await createBoard({
        name: "LinkedIn",
        url: "https://linkedin.com/jobs",
        searchSelector: "",
      });

      expect(mockInvoke).toHaveBeenNthCalledWith(1, "db:query", {
        sql: "INSERT INTO boards (name, url, search_selector) VALUES (?, ?, ?)",
        params: ["LinkedIn", "https://linkedin.com/jobs", null],
      });
      expect(mockInvoke).toHaveBeenNthCalledWith(2, "db:query", {
        sql: "SELECT id, name, url, search_selector, created_at FROM boards WHERE id = ?",
        params: [2],
      });
      expect(result.id).toBe(2);
    });

    it("maps UNIQUE constraint failure to user message", async () => {
      mockInvoke.mockResolvedValue({
        error: "UNIQUE constraint failed: boards.url",
      });

      await expect(
        createBoard({
          name: "Dup",
          url: "https://example.com",
          searchSelector: null,
        })
      ).rejects.toThrow("A board with this URL already exists.");
    });
  });

  describe("updateBoard", () => {
    it("updates with parameterized SQL", async () => {
      mockInvoke.mockResolvedValue({ changes: 1, lastInsertRowid: 0 });

      await updateBoard(3, {
        name: "Updated",
        url: "https://updated.example",
        searchSelector: "input.q",
      });

      expect(mockInvoke).toHaveBeenCalledWith("db:query", {
        sql: "UPDATE boards SET name = ?, url = ?, search_selector = ? WHERE id = ?",
        params: ["Updated", "https://updated.example", "input.q", 3],
      });
    });

    it("maps UNIQUE constraint failure on update", async () => {
      mockInvoke.mockResolvedValue({
        error: "UNIQUE constraint failed: boards.url",
      });

      await expect(
        updateBoard(1, {
          name: "X",
          url: "https://dup.example",
          searchSelector: null,
        })
      ).rejects.toThrow("A board with this URL already exists.");
    });
  });

  describe("deleteBoard", () => {
    it("deletes with parameterized SQL", async () => {
      mockInvoke.mockResolvedValue({ changes: 1, lastInsertRowid: 0 });

      await deleteBoard(5);

      expect(mockInvoke).toHaveBeenCalledWith("db:query", {
        sql: "DELETE FROM boards WHERE id = ?",
        params: [5],
      });
    });

    it("maps FOREIGN KEY constraint failure", async () => {
      mockInvoke.mockResolvedValue({ error: "FOREIGN KEY constraint failed" });

      await expect(deleteBoard(1)).rejects.toThrow(
        "Cannot delete this board while jobs reference it."
      );
    });
  });

  describe("normalizeSearchSelector", () => {
    it("stores blank selector as null", () => {
      expect(normalizeSearchSelector("")).toBeNull();
      expect(normalizeSearchSelector("   ")).toBeNull();
      expect(normalizeSearchSelector(null)).toBeNull();
      expect(normalizeSearchSelector(undefined)).toBeNull();
    });

    it("preserves non-blank selector", () => {
      expect(normalizeSearchSelector("input.search")).toBe("input.search");
    });
  });

  describe("mapDbError", () => {
    it("maps known SQLite errors", () => {
      expect(mapDbError("UNIQUE constraint failed: boards.url")).toBe(
        "A board with this URL already exists."
      );
      expect(mapDbError("FOREIGN KEY constraint failed")).toBe(
        "Cannot delete this board while jobs reference it."
      );
    });
  });
});
