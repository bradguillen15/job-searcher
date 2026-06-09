import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  LIST_JOBS_SQL,
  listJobsWithMeta,
  listActivities,
  addActivity,
  updateJobStatus,
  JobsDbError,
} from "../../src/renderer/lib/jobs-db";

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

const sampleJobRow = {
  id: 1,
  board_id: 2,
  keyword_id: 3,
  run_id: 4,
  title: "Engineer",
  company: "Acme",
  location: "Remote",
  posted_date: "2026-06-01",
  description: "Build things",
  url: "https://example.com/job/1",
  score: 85,
  match_reason: "Strong fit",
  status: "new",
  scraped_at: "2026-06-08T12:00:00.000Z",
  board_name: "Indeed",
  keyword_text: "typescript",
};

describe("jobs-db", () => {
  describe("listJobsWithMeta", () => {
    it("invokes db:query with join SQL and empty params", async () => {
      mockInvoke.mockResolvedValue([sampleJobRow]);

      const result = await listJobsWithMeta();

      expect(mockInvoke).toHaveBeenCalledWith("db:query", {
        sql: LIST_JOBS_SQL,
        params: [],
      });
      expect(result).toHaveLength(1);
      expect(result[0]?.title).toBe("Engineer");
      expect(result[0]?.board_name).toBe("Indeed");
      expect(result[0]?.keyword_text).toBe("typescript");
    });

    it("coerces unknown status to new", async () => {
      mockInvoke.mockResolvedValue([{ ...sampleJobRow, status: "bogus" }]);

      const result = await listJobsWithMeta();

      expect(result[0]?.status).toBe("new");
    });

    it("throws JobsDbError when db:query returns error", async () => {
      mockInvoke.mockResolvedValue({ error: "disk I/O error" });

      await expect(listJobsWithMeta()).rejects.toThrow(JobsDbError);
      await expect(listJobsWithMeta()).rejects.toThrow("disk I/O error");
    });
  });

  describe("listActivities", () => {
    it("queries activities for job id with parameterized SQL", async () => {
      const activities = [
        {
          id: 10,
          job_id: 1,
          type: "note",
          notes: "Follow up",
          scheduled_at: null,
          created_at: "2026-06-08T13:00:00.000Z",
        },
      ];
      mockInvoke.mockResolvedValue(activities);

      const result = await listActivities(1);

      expect(mockInvoke).toHaveBeenCalledWith("db:query", {
        sql: expect.stringContaining("FROM activities"),
        params: [1],
      });
      expect(result).toEqual(activities);
    });
  });

  describe("addActivity", () => {
    it("inserts activity and fetches created row", async () => {
      mockInvoke
        .mockResolvedValueOnce({ changes: 1, lastInsertRowid: 11 })
        .mockResolvedValueOnce([
          {
            id: 11,
            job_id: 1,
            type: "status_change",
            notes: "Status set to applying",
            scheduled_at: null,
            created_at: "2026-06-08T14:00:00.000Z",
          },
        ]);

      const result = await addActivity({
        jobId: 1,
        type: "status_change",
        notes: "Status set to applying",
      });

      expect(mockInvoke).toHaveBeenNthCalledWith(1, "db:query", {
        sql: "INSERT INTO activities (job_id, type, notes) VALUES (?, ?, ?)",
        params: [1, "status_change", "Status set to applying"],
      });
      expect(result.id).toBe(11);
      expect(result.type).toBe("status_change");
    });
  });

  describe("updateJobStatus", () => {
    it("updates status with parameterized SQL", async () => {
      mockInvoke.mockResolvedValue({ changes: 1, lastInsertRowid: 0 });

      await updateJobStatus(5, "applied");

      expect(mockInvoke).toHaveBeenCalledWith("db:query", {
        sql: "UPDATE jobs SET status = ? WHERE id = ?",
        params: ["applied", 5],
      });
    });
  });
});
