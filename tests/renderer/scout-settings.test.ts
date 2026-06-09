import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  loadDefaultDateRange,
  SCOUT_DEFAULT_DATE_RANGE_KEY,
} from "../../src/renderer/lib/scout-settings";

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

describe("scout-settings", () => {
  describe("loadDefaultDateRange", () => {
    it("returns valid setting value from database", async () => {
      mockInvoke.mockResolvedValue([{ value: "7d" }]);

      const result = await loadDefaultDateRange();

      expect(mockInvoke).toHaveBeenCalledWith("db:query", {
        sql: "SELECT value FROM settings WHERE key = ?",
        params: [SCOUT_DEFAULT_DATE_RANGE_KEY],
      });
      expect(result).toBe("7d");
    });

    it("falls back to 30d when setting row is missing", async () => {
      mockInvoke.mockResolvedValue([]);

      const result = await loadDefaultDateRange();

      expect(result).toBe("30d");
    });

    it("falls back to 30d when setting value is invalid", async () => {
      mockInvoke.mockResolvedValue([{ value: "365d" }]);

      const result = await loadDefaultDateRange();

      expect(result).toBe("30d");
    });
  });
});
