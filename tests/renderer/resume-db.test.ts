import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getResume, ResumeDbError } from "../../src/renderer/lib/resume-db";

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

describe("resume-db", () => {
  describe("getResume", () => {
    it("invokes db:query with parameterized SELECT and empty params", async () => {
      const resume = {
        id: 1,
        filename: "resume.pdf",
        raw_text: "text",
        skill_profile: null,
        current_company: null,
        current_salary: null,
        target_salary: null,
        search_mode: null,
        updated_at: "2026-06-08T12:00:00.000Z",
      };
      mockInvoke.mockResolvedValue([resume]);

      const result = await getResume();

      expect(mockInvoke).toHaveBeenCalledWith("db:query", {
        sql: expect.stringContaining("FROM resume ORDER BY updated_at DESC LIMIT 1"),
        params: [],
      });
      expect(result).toEqual(resume);
    });

    it("returns null when query returns empty array", async () => {
      mockInvoke.mockResolvedValue([]);

      const result = await getResume();

      expect(result).toBeNull();
    });

    it("throws ResumeDbError when db:query returns error", async () => {
      mockInvoke.mockResolvedValue({ error: "disk I/O error" });

      await expect(getResume()).rejects.toThrow(ResumeDbError);
      await expect(getResume()).rejects.toThrow("disk I/O error");
    });
  });
});
