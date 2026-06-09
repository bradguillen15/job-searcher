import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import PipelineScreen from "../../src/renderer/screens/PipelineScreen";
import { LIST_PIPELINE_JOBS_SQL } from "../../src/renderer/lib/jobs-db";
import type { PipelineJobWithMeta } from "../../src/renderer/types/job";

const mockInvoke = vi.fn();

const samplePipelineJobs: PipelineJobWithMeta[] = [
  {
    id: 1,
    board_id: 1,
    keyword_id: 1,
    run_id: 1,
    title: "React Engineer",
    company: "Acme",
    location: "Remote",
    posted_date: null,
    description: null,
    url: "https://example.com/job/1",
    score: 85,
    match_reason: null,
    status: "applying",
    scraped_at: "2026-06-08T12:00:00.000Z",
    board_name: "Indeed",
    keyword_text: "react",
    last_activity_at: "2026-06-08T10:00:00.000Z",
  },
  {
    id: 2,
    board_id: 1,
    keyword_id: 2,
    run_id: 1,
    title: "TypeScript Dev",
    company: "Beta",
    location: null,
    posted_date: null,
    description: null,
    url: "https://example.com/job/2",
    score: 60,
    match_reason: null,
    status: "applying",
    scraped_at: "2026-06-08T11:00:00.000Z",
    board_name: "LinkedIn",
    keyword_text: "typescript",
    last_activity_at: "2026-06-08T14:00:00.000Z",
  },
  {
    id: 3,
    board_id: 1,
    keyword_id: 1,
    run_id: 1,
    title: "Backend Role",
    company: "Gamma",
    location: null,
    posted_date: null,
    description: null,
    url: "https://example.com/job/3",
    score: null,
    match_reason: null,
    status: "applied",
    scraped_at: "2026-06-08T09:00:00.000Z",
    board_name: "Indeed",
    keyword_text: "node",
    last_activity_at: null,
  },
];

let pipelineJobsState = [...samplePipelineJobs];
let lastInsertedActivity: {
  id: number;
  job_id: number;
  type: string;
  notes: string | null;
  scheduled_at: null;
  created_at: string;
} | null = null;

function handleDbQuery(payload: {
  sql: string;
  params?: unknown[];
}): Promise<unknown> {
  const { sql, params = [] } = payload;

  if (sql === LIST_PIPELINE_JOBS_SQL) {
    return Promise.resolve(
      pipelineJobsState.map((job) => ({ ...job }))
    );
  }

  if (sql.startsWith("INSERT INTO activities")) {
    const [jobId, type, notes] = params as [number, string, string];
    lastInsertedActivity = {
      id: 99,
      job_id: jobId,
      type,
      notes,
      scheduled_at: null,
      created_at: "2026-06-08T16:00:00.000Z",
    };
    return Promise.resolve({ changes: 1, lastInsertRowid: 99 });
  }

  if (sql.includes("FROM activities WHERE id = ?")) {
    return Promise.resolve(lastInsertedActivity ? [lastInsertedActivity] : []);
  }

  if (sql.startsWith("UPDATE jobs SET status")) {
    const [status, jobId] = params as [string, number];
    pipelineJobsState = pipelineJobsState.map((job) =>
      job.id === jobId
        ? {
            ...job,
            status: status as PipelineJobWithMeta["status"],
          }
        : job
    );
    return Promise.resolve({ changes: 1, lastInsertRowid: 0 });
  }

  return Promise.reject(new Error(`unexpected sql: ${sql}`));
}

beforeEach(() => {
  pipelineJobsState = samplePipelineJobs.map((job) => ({ ...job }));
  lastInsertedActivity = null;
  mockInvoke.mockReset();

  mockInvoke.mockImplementation((channel: string, payload?: unknown) => {
    if (channel === "db:query") {
      return handleDbQuery(payload as { sql: string; params?: unknown[] });
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

function getColumn(label: string): HTMLElement {
  return screen.getByRole("region", { name: `${label} column` });
}

function getJobCard(title: string): HTMLElement {
  const titleEl = screen.getByText(title);
  const card = titleEl.closest('[data-slot="card"]');
  if (!card) {
    throw new Error(`No card found for job "${title}"`);
  }
  return card as HTMLElement;
}

describe("PipelineScreen", () => {
  it("renders Pipeline heading and active job count", async () => {
    render(<PipelineScreen />);

    expect(
      await screen.findByRole("heading", { name: "Pipeline" })
    ).toBeTruthy();
    expect(screen.getByText("3 active jobs")).toBeTruthy();
  });

  it("renders six kanban columns with correct labels", async () => {
    render(<PipelineScreen />);
    await screen.findByText("3 active jobs");

    for (const label of [
      "Applying",
      "Applied",
      "Interviewing",
      "Offer",
      "Accepted",
      "Rejected",
    ]) {
      expect(getColumn(label)).toBeTruthy();
    }
  });

  it("places jobs only in their status column", async () => {
    render(<PipelineScreen />);
    await screen.findByText("React Engineer");

    const applying = getColumn("Applying");
    const applied = getColumn("Applied");

    expect(within(applying).getByText("React Engineer")).toBeTruthy();
    expect(within(applying).getByText("TypeScript Dev")).toBeTruthy();
    expect(within(applied).getByText("Backend Role")).toBeTruthy();
    expect(within(applying).queryByText("Backend Role")).toBeNull();
  });

  it("orders jobs within column by last_activity_at descending", async () => {
    render(<PipelineScreen />);
    await screen.findByText("React Engineer");

    const applying = getColumn("Applying");
    const titles = within(applying)
      .getAllByText(/Engineer|Dev/)
      .map((el) => el.textContent);

    expect(titles).toEqual(["TypeScript Dev", "React Engineer"]);
  });

  it("displays score badge and last activity date on cards", async () => {
    render(<PipelineScreen />);
    await screen.findByText("React Engineer");

    const card = getJobCard("React Engineer");
    expect(within(card).getByText("85")).toBeTruthy();
    expect(
      within(card).getByText(
        new Date("2026-06-08T10:00:00.000Z").toLocaleDateString()
      )
    ).toBeTruthy();
  });

  it("shows No activity when last_activity_at is null", async () => {
    render(<PipelineScreen />);
    await screen.findByText("Backend Role");

    const applied = getColumn("Applied");
    expect(within(applied).getByText("No activity")).toBeTruthy();
    expect(within(applied).getByText("—")).toBeTruthy();
  });

  it("shows global empty state when no pipeline jobs exist", async () => {
    pipelineJobsState = [];
    render(<PipelineScreen />);

    expect(
      await screen.findByText(
        /No jobs in your pipeline yet\. On Results, change a job's status to Applying or beyond to track it here\./
      )
    ).toBeTruthy();
  });

  it("shows column empty placeholder when column has no jobs", async () => {
    render(<PipelineScreen />);
    await screen.findByText("3 active jobs");

    const offer = getColumn("Offer");
    expect(within(offer).getByText("No jobs")).toBeTruthy();
  });

  it("quick-add inserts note and updates last activity date", async () => {
    const user = userEvent.setup();
    render(<PipelineScreen />);
    await screen.findByText("React Engineer");

    const card = getJobCard("React Engineer");
    await user.click(within(card).getByRole("button", { name: "Quick add" }));

    const noteInput = within(card).getByRole("textbox", {
      name: "Quick add note",
    });
    await user.type(noteInput, "Follow up");
    await user.click(within(card).getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(
        within(card).getByText(
          new Date("2026-06-08T16:00:00.000Z").toLocaleDateString()
        )
      ).toBeTruthy();
    });

    const insertCalls = mockInvoke.mock.calls.filter(
      ([channel, payload]) =>
        channel === "db:query" &&
        (payload as { sql: string }).sql.startsWith("INSERT INTO activities")
    );
    expect(insertCalls.length).toBeGreaterThan(0);
  });

  it("shows validation for empty quick-add note", async () => {
    const user = userEvent.setup();
    render(<PipelineScreen />);
    await screen.findByText("React Engineer");

    const card = getJobCard("React Engineer");
    await user.click(within(card).getByRole("button", { name: "Quick add" }));
    await user.click(within(card).getByRole("button", { name: "Save" }));

    expect(screen.getByText("Note cannot be empty.")).toBeTruthy();

    const insertCalls = mockInvoke.mock.calls.filter(
      ([channel, payload]) =>
        channel === "db:query" &&
        (payload as { sql: string }).sql.startsWith("INSERT INTO activities")
    );
    expect(insertCalls).toHaveLength(0);
  });

  it("renders status change buttons for each pipeline status", async () => {
    render(<PipelineScreen />);
    await screen.findByText("React Engineer");

    const card = getJobCard("React Engineer");
    const group = within(card).getByRole("group", {
      name: "Change pipeline status",
    });

    for (const label of [
      "Applying",
      "Applied",
      "Interviewing",
      "Offer",
      "Accepted",
      "Rejected",
    ]) {
      expect(within(group).getByRole("button", { name: label })).toBeTruthy();
    }
  });

  it("moves card to new column on status change", async () => {
    const user = userEvent.setup();
    render(<PipelineScreen />);
    await screen.findByText("React Engineer");

    const card = getJobCard("React Engineer");
    const applying = getColumn("Applying");
    const applied = getColumn("Applied");

    await user.click(within(card).getByRole("button", { name: "Applied" }));

    await waitFor(() => {
      expect(within(applied).getByText("React Engineer")).toBeTruthy();
      expect(within(applying).queryByText("React Engineer")).toBeNull();
    });

    expect(mockInvoke).toHaveBeenCalledWith("db:query", {
      sql: "UPDATE jobs SET status = ? WHERE id = ?",
      params: ["applied", 1],
    });
  });

  it("surfaces database errors without crashing", async () => {
    mockInvoke.mockImplementation((channel: string) => {
      if (channel === "db:query") {
        return Promise.resolve({ error: "database locked" });
      }
      return Promise.reject(new Error("unexpected"));
    });

    render(<PipelineScreen />);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("database locked");
  });
});
