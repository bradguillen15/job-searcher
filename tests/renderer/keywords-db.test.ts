import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  listKeywords,
  createKeyword,
  setKeywordActive,
  deleteKeyword,
  mapDbError,
  KeywordsDbError,
} from "../../src/renderer/lib/keywords-db";

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

describe("keywords-db", () => {
  describe("listKeywords", () => {
    it("invokes db:query with list SQL and empty params", async () => {
      const keywords = [
        {
          id: 1,
          keyword: "typescript",
          active: 1,
          created_at: "2026-06-08T12:00:00.000Z",
        },
      ];
      mockInvoke.mockResolvedValue(keywords);

      const result = await listKeywords();

      expect(mockInvoke).toHaveBeenCalledWith("db:query", {
        sql: "SELECT id, keyword, active, created_at FROM keywords ORDER BY keyword ASC",
        params: [],
      });
      expect(result).toEqual(keywords);
    });

    it("throws KeywordsDbError when db:query returns error", async () => {
      mockInvoke.mockResolvedValue({ error: "disk I/O error" });

      await expect(listKeywords()).rejects.toThrow(KeywordsDbError);
      await expect(listKeywords()).rejects.toThrow("disk I/O error");
    });
  });

  describe("createKeyword", () => {
    it("inserts with active default 1 and fetches new row", async () => {
      mockInvoke
        .mockResolvedValueOnce({ changes: 1, lastInsertRowid: 2 })
        .mockResolvedValueOnce([
          {
            id: 2,
            keyword: "react",
            active: 1,
            created_at: "2026-06-08T12:00:00.000Z",
          },
        ]);

      const result = await createKeyword({ keyword: "react" });

      expect(mockInvoke).toHaveBeenNthCalledWith(1, "db:query", {
        sql: "INSERT INTO keywords (keyword, active) VALUES (?, 1)",
        params: ["react"],
      });
      expect(mockInvoke).toHaveBeenNthCalledWith(2, "db:query", {
        sql: "SELECT id, keyword, active, created_at FROM keywords WHERE id = ?",
        params: [2],
      });
      expect(result.id).toBe(2);
      expect(result.active).toBe(1);
    });

    it("trims keyword before insert", async () => {
      mockInvoke
        .mockResolvedValueOnce({ changes: 1, lastInsertRowid: 3 })
        .mockResolvedValueOnce([
          {
            id: 3,
            keyword: "node",
            active: 1,
            created_at: "2026-06-08T12:00:00.000Z",
          },
        ]);

      await createKeyword({ keyword: "  node  " });

      expect(mockInvoke).toHaveBeenNthCalledWith(1, "db:query", {
        sql: "INSERT INTO keywords (keyword, active) VALUES (?, 1)",
        params: ["node"],
      });
    });

    it("maps UNIQUE constraint failure to user message", async () => {
      mockInvoke.mockResolvedValue({
        error: "UNIQUE constraint failed: keywords.keyword",
      });

      await expect(createKeyword({ keyword: "dup" })).rejects.toThrow(
        "A keyword with this text already exists."
      );
    });
  });

  describe("setKeywordActive", () => {
    it("updates active with parameterized SQL when enabling", async () => {
      mockInvoke.mockResolvedValue({ changes: 1, lastInsertRowid: 0 });

      await setKeywordActive(4, true);

      expect(mockInvoke).toHaveBeenCalledWith("db:query", {
        sql: "UPDATE keywords SET active = ? WHERE id = ?",
        params: [1, 4],
      });
    });

    it("updates active with 0 when disabling", async () => {
      mockInvoke.mockResolvedValue({ changes: 1, lastInsertRowid: 0 });

      await setKeywordActive(4, false);

      expect(mockInvoke).toHaveBeenCalledWith("db:query", {
        sql: "UPDATE keywords SET active = ? WHERE id = ?",
        params: [0, 4],
      });
    });
  });

  describe("deleteKeyword", () => {
    it("deletes with parameterized SQL", async () => {
      mockInvoke.mockResolvedValue({ changes: 1, lastInsertRowid: 0 });

      await deleteKeyword(5);

      expect(mockInvoke).toHaveBeenCalledWith("db:query", {
        sql: "DELETE FROM keywords WHERE id = ?",
        params: [5],
      });
    });

    it("maps FOREIGN KEY constraint failure", async () => {
      mockInvoke.mockResolvedValue({ error: "FOREIGN KEY constraint failed" });

      await expect(deleteKeyword(1)).rejects.toThrow(
        "Cannot delete this keyword while jobs reference it."
      );
    });
  });

  describe("mapDbError", () => {
    it("maps known SQLite errors", () => {
      expect(mapDbError("UNIQUE constraint failed: keywords.keyword")).toBe(
        "A keyword with this text already exists."
      );
      expect(mapDbError("FOREIGN KEY constraint failed")).toBe(
        "Cannot delete this keyword while jobs reference it."
      );
    });
  });
});
