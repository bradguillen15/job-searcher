import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import ResultsScreen from "../../src/renderer/screens/ResultsScreen";
import { LIST_JOBS_SQL } from "../../src/renderer/lib/jobs-db";
import type { JobWithMeta } from "../../src/renderer/types/job";

const mockInvoke = vi.fn();

const sampleJobs: JobWithMeta[] = [
  {
    id: 1,
    board_id: 1,
    keyword_id: 1,
    run_id: 1,
    title: "Senior React Engineer",
    company: "Acme",
    location: "Remote",
    posted_date: "2026-06-01T00:00:00.000Z",
    description: "x".repeat(450),
    url: "https://example.com/job/1",
    score: 80,
    match_reason: "Strong React experience",
    status: "new",
    scraped_at: "2026-06-08T12:00:00.000Z",
    board_name: "Indeed",
    keyword_text: "react",
  },
  {
    id: 2,
    board_id: 1,
    keyword_id: 2,
    run_id: 1,
    title: "TypeScript Developer",
    company: "Beta",
    location: "NYC",
    posted_date: "2026-06-02T00:00:00.000Z",
    description: "TypeScript role",
    url: "https://example.com/job/2",
    score: 60,
    match_reason: null,
    status: "applying",
    scraped_at: "2026-06-08T11:00:00.000Z",
    board_name: "LinkedIn",
    keyword_text: "typescript",
  },
  {
    id: 3,
    board_id: 1,
    keyword_id: 1,
    run_id: 1,
    title: "Frontend Engineer",
    company: "Gamma",
    location: null,
    posted_date: null,
    description: "Frontend work",
    url: "https://example.com/job/3",
    score: 40,
    match_reason: null,
    status: "new",
    scraped_at: "2026-06-08T10:00:00.000Z",
    board_name: "Indeed",
    keyword_text: "react",
  },
  {
    id: 4,
    board_id: 1,
    keyword_id: 3,
    run_id: 1,
    title: "Unscored Role",
    company: "Delta",
    location: null,
    posted_date: null,
    description: null,
    url: "https://example.com/job/4",
    score: null,
    match_reason: null,
    status: "new",
    scraped_at: "2026-06-08T09:00:00.000Z",
    board_name: "Indeed",
    keyword_text: "node",
  },
];

let jobsState = [...sampleJobs];
let activitiesState: Record<number, Array<{
  id: number;
  job_id: number;
  type: string;
  notes: string | null;
  scheduled_at: string | null;
  created_at: string;
}>> = {};

function handleDbQuery(payload: {
  sql: string;
  params?: unknown[];
}): Promise<unknown> {
  const { sql, params = [] } = payload;

  if (sql === LIST_JOBS_SQL) {
    return Promise.resolve(
      jobsState.map((job) => ({
        ...job,
      }))
    );
  }

  if (sql.includes("FROM activities") && sql.includes("WHERE job_id = ?")) {
    const jobId = Number(params[0]);
    return Promise.resolve(activitiesState[jobId] ?? []);
  }

  if (sql.startsWith("INSERT INTO activities")) {
    const [jobId, type, notes] = params as [number, string, string];
    const activity = {
      id: Object.values(activitiesState).flat().length + 1,
      job_id: jobId,
      type,
      notes,
      scheduled_at: null,
      created_at: "2026-06-08T15:00:00.000Z",
    };
    activitiesState[jobId] = [activity, ...(activitiesState[jobId] ?? [])];
    return Promise.resolve({ changes: 1, lastInsertRowid: activity.id });
  }

  if (sql.includes("FROM activities WHERE id = ?")) {
    const id = Number(params[0]);
    const activity = Object.values(activitiesState)
      .flat()
      .find((row) => row.id === id);
    return Promise.resolve(activity ? [activity] : []);
  }

  if (sql.startsWith("UPDATE jobs SET status")) {
    const [status, jobId] = params as [string, number];
    jobsState = jobsState.map((job) =>
      job.id === jobId ? { ...job, status: status as JobWithMeta["status"] } : job
    );
    return Promise.resolve({ changes: 1, lastInsertRowid: 0 });
  }

  return Promise.reject(new Error(`unexpected sql: ${sql}`));
}

beforeEach(() => {
  jobsState = sampleJobs.map((job) => ({ ...job }));
  activitiesState = {};
  mockInvoke.mockReset();

  mockInvoke.mockImplementation((channel: string, payload?: unknown) => {
    if (channel === "db:query") {
      return handleDbQuery(payload as { sql: string; params?: unknown[] });
    }
    if (channel === "fs:openPath") {
      return Promise.resolve({ ok: true });
    }
    return Promise.reject(new Error(`unexpected channel: ${channel}`));
  });

  Object.defineProperty(window, "api", {
    configurable: true,
    value: { invoke: mockInvoke },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ResultsScreen", () => {
  it("renders Results heading and job count summary", async () => {
    render(<ResultsScreen />);

    expect(await screen.findByRole("heading", { name: "Results" })).toBeTruthy();
    expect(screen.getByText("4 of 4 jobs")).toBeTruthy();
  });

  it("renders jobs in score-descending order", async () => {
    render(<ResultsScreen />);

    const titles = await screen.findAllByRole("heading", { level: 3 });
    expect(titles.map((el) => el.textContent)).toEqual([
      "Senior React Engineer",
      "TypeScript Developer",
      "Frontend Engineer",
      "Unscored Role",
    ]);
  });

  it("renders score badge colors for high medium low and null scores", async () => {
    render(<ResultsScreen />);
    await screen.findByText("Senior React Engineer");

    expect(document.querySelector(".text-emerald-400")).toBeTruthy();
    expect(document.querySelector(".text-amber-400")).toBeTruthy();
    expect(document.querySelector(".text-red-400")).toBeTruthy();
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("shows empty scout state when no jobs exist", async () => {
    jobsState = [];
    render(<ResultsScreen />);

    expect(
      await screen.findByText("No jobs yet. Run Scout to discover listings.")
    ).toBeTruthy();
  });

  it("defaults to All status tab and shows all jobs", async () => {
    render(<ResultsScreen />);
    await screen.findByText("4 of 4 jobs");

    const allTab = screen.getByRole("tab", { name: "All" });
    expect(allTab.getAttribute("aria-selected")).toBe("true");
  });

  it("renders all eight status filter tabs", async () => {
    render(<ResultsScreen />);
    await screen.findByText("4 of 4 jobs");

    for (const name of [
      "All",
      "New",
      "Applying",
      "Applied",
      "Interviewing",
      "Offer",
      "Accepted",
      "Rejected",
    ]) {
      expect(screen.getByRole("tab", { name })).toBeTruthy();
    }
  });

  it("initializes score threshold slider with range 0–100 and value 0", async () => {
    render(<ResultsScreen />);
    await screen.findByText("4 of 4 jobs");

    expect(screen.getByText("Min score: Any")).toBeTruthy();

    const slider = screen.getByRole("slider", {
      name: "Minimum score threshold",
    });
    expect(slider.getAttribute("min")).toBe("0");
    expect(slider.getAttribute("max")).toBe("100");
    expect(slider.getAttribute("value")).toBe("0");
  });

  it("renders collapsed job card metadata on summary row", async () => {
    render(<ResultsScreen />);
    await screen.findByText("Senior React Engineer");

    expect(screen.getByText("Acme · Remote")).toBeTruthy();

    const postedDate = new Date(
      "2026-06-01T00:00:00.000Z"
    ).toLocaleDateString();
    expect(
      screen.getByText(`New · react · Indeed · ${postedDate}`)
    ).toBeTruthy();
  });

  it("filters jobs by status tab", async () => {
    const user = userEvent.setup();
    render(<ResultsScreen />);
    await screen.findByText("TypeScript Developer");

    await user.click(screen.getByRole("tab", { name: "Applying" }));

    expect(screen.getByText("1 of 4 jobs")).toBeTruthy();
    expect(screen.getByText("TypeScript Developer")).toBeTruthy();
    expect(screen.queryByText("Senior React Engineer")).toBeNull();
  });

  it("filters jobs by score threshold slider", async () => {
    const user = userEvent.setup();
    render(<ResultsScreen />);
    await screen.findByText("Unscored Role");

    const slider = screen.getByRole("slider", {
      name: "Minimum score threshold",
    });
    fireEvent.change(slider, { target: { value: "70" } });

    await waitFor(() => {
      expect(screen.getByText("1 of 4 jobs")).toBeTruthy();
      expect(screen.queryByText("Unscored Role")).toBeNull();
      expect(screen.queryByText("Frontend Engineer")).toBeNull();
    });
  });

  it("filters jobs by keyword chips", async () => {
    const user = userEvent.setup();
    render(<ResultsScreen />);
    await screen.findByText("TypeScript Developer");

    await user.click(screen.getByRole("button", { name: "typescript" }));

    expect(screen.getByText("1 of 4 jobs")).toBeTruthy();
    expect(screen.getByText("TypeScript Developer")).toBeTruthy();
    expect(screen.queryByText("Senior React Engineer")).toBeNull();
  });

  it("does not reload jobs from database when filters change", async () => {
    const user = userEvent.setup();
    render(<ResultsScreen />);
    await screen.findByText("4 of 4 jobs");

    const listCalls = (): unknown[][] =>
      mockInvoke.mock.calls.filter(
        ([channel, payload]) =>
          channel === "db:query" &&
          (payload as { sql: string }).sql === LIST_JOBS_SQL
      );

    expect(listCalls()).toHaveLength(1);

    await user.click(screen.getByRole("tab", { name: "Applying" }));
    expect(listCalls()).toHaveLength(1);
    expect(screen.getByText("1 of 4 jobs")).toBeTruthy();

    const slider = screen.getByRole("slider", {
      name: "Minimum score threshold",
    });
    fireEvent.change(slider, { target: { value: "50" } });
    await waitFor(() => {
      expect(screen.getByText("1 of 4 jobs")).toBeTruthy();
    });
    expect(listCalls()).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "typescript" }));
    expect(listCalls()).toHaveLength(1);
  });

  it("shows no matches message when filters hide all jobs", async () => {
    const user = userEvent.setup();
    render(<ResultsScreen />);
    await screen.findByText("Senior React Engineer");

    await user.click(screen.getByRole("tab", { name: "Rejected" }));

    expect(
      screen.getByText("No jobs match the current filters.")
    ).toBeTruthy();
  });

  it("expands job card and shows truncated description and match reason", async () => {
    const user = userEvent.setup();
    render(<ResultsScreen />);
    await screen.findByText("Senior React Engineer");

    await user.click(screen.getByText("Senior React Engineer"));

    const snippet = screen.getByText(/^x{400}…$/);
    expect(snippet).toBeTruthy();
    expect(screen.getByText("Strong React experience")).toBeTruthy();
  });

  it("loads and displays activity log on expand with empty state", async () => {
    const user = userEvent.setup();
    render(<ResultsScreen />);
    await screen.findByText("TypeScript Developer");

    await user.click(screen.getByText("TypeScript Developer"));

    expect(await screen.findByText("No activities yet.")).toBeTruthy();
    expect(mockInvoke).toHaveBeenCalledWith(
      "db:query",
      expect.objectContaining({
        sql: expect.stringContaining("FROM activities"),
        params: [2],
      })
    );
  });

  it("updates status and refreshes activity log on status change", async () => {
    const user = userEvent.setup();
    render(<ResultsScreen />);
    await screen.findByText("Senior React Engineer");

    await user.click(screen.getByText("Senior React Engineer"));
    const expanded = screen.getByText("Senior React Engineer").closest("li");
    expect(expanded).toBeTruthy();

    await user.click(
      within(expanded as HTMLElement).getByRole("button", { name: "Applying" })
    );

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("db:query", {
        sql: "UPDATE jobs SET status = ? WHERE id = ?",
        params: ["applying", 1],
      });
    });

    const activityTimestamp = new Date(
      "2026-06-08T15:00:00.000Z"
    ).toLocaleString();

    await waitFor(() => {
      expect(
        screen.getByText("Status: Status set to applying")
      ).toBeTruthy();
      expect(screen.getByText(activityTimestamp)).toBeTruthy();
    });
  });

  it("adds note and clears input on submit", async () => {
    const user = userEvent.setup();
    render(<ResultsScreen />);
    await screen.findByText("Senior React Engineer");

    await user.click(screen.getByText("Senior React Engineer"));
    const noteInput = screen.getByRole("textbox", { name: "Note" });
    await user.type(noteInput, "Reached out to recruiter");
    await user.click(screen.getByRole("button", { name: "Add note" }));

    const activityTimestamp = new Date(
      "2026-06-08T15:00:00.000Z"
    ).toLocaleString();

    await waitFor(() => {
      expect(screen.getByText("Reached out to recruiter")).toBeTruthy();
      expect(screen.getByText(activityTimestamp)).toBeTruthy();
    });
    expect((noteInput as HTMLTextAreaElement).value).toBe("");
  });

  it("shows validation message for empty note", async () => {
    const user = userEvent.setup();
    render(<ResultsScreen />);
    await screen.findByText("Senior React Engineer");

    await user.click(screen.getByText("Senior React Engineer"));
    await user.click(screen.getByRole("button", { name: "Add note" }));

    expect(screen.getByText("Note cannot be empty.")).toBeTruthy();
    const insertCalls = mockInvoke.mock.calls.filter(
      ([channel, payload]) =>
        channel === "db:query" &&
        (payload as { sql: string }).sql.startsWith("INSERT INTO activities")
    );
    expect(insertCalls).toHaveLength(0);
  });

  it("collapses expanded card when toggled again", async () => {
    const user = userEvent.setup();
    render(<ResultsScreen />);
    await screen.findByText("Senior React Engineer");

    await user.click(screen.getByText("Senior React Engineer"));
    expect(screen.getByText("Strong React experience")).toBeTruthy();

    await user.click(screen.getByText("Senior React Engineer"));
    expect(screen.queryByText("Strong React experience")).toBeNull();
  });

  it("opens external job URL via fs:openPath", async () => {
    const user = userEvent.setup();
    render(<ResultsScreen />);
    await screen.findByText("Senior React Engineer");

    await user.click(screen.getByText("Senior React Engineer"));
    await user.click(screen.getByRole("button", { name: "Open posting" }));

    expect(mockInvoke).toHaveBeenCalledWith(
      "fs:openPath",
      "https://example.com/job/1"
    );
  });

  it("surfaces database errors without crashing", async () => {
    mockInvoke.mockImplementation((channel: string) => {
      if (channel === "db:query") {
        return Promise.resolve({ error: "database locked" });
      }
      return Promise.reject(new Error("unexpected"));
    });

    render(<ResultsScreen />);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("database locked");
  });
});
