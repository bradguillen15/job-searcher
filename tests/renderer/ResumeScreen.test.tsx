import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import ResumeScreen from "../../src/renderer/screens/ResumeScreen";
import type { Resume } from "../../src/renderer/types/resume";

const mockInvoke = vi.fn();

const sampleResume: Resume = {
  id: 1,
  filename: "my-resume.pdf",
  raw_text: "Hidden resume body text",
  skill_profile: null,
  current_company: null,
  current_salary: null,
  target_salary: null,
  search_mode: null,
  updated_at: "2026-06-08T12:00:00.000Z",
};

const resumeWithProfile: Resume = {
  ...sampleResume,
  skill_profile: "TypeScript, React, Node.js",
};

function mockResumeLoad(resume: Resume | null): void {
  mockInvoke.mockImplementation((channel: string) => {
    if (channel === "db:query") {
      return Promise.resolve(resume ? [resume] : []);
    }
    return Promise.reject(new Error(`unexpected channel: ${channel}`));
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

describe("ResumeScreen", () => {
  it("shows empty state when no resume exists", async () => {
    mockResumeLoad(null);

    render(<ResumeScreen />);

    expect(
      await screen.findByText(/No resume uploaded yet/)
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Upload resume" })).toBeTruthy();
  });

  it("upload button invokes resume:upload", async () => {
    const user = userEvent.setup();
    mockResumeLoad(null);
    mockInvoke.mockImplementation((channel: string) => {
      if (channel === "db:query") {
        return Promise.resolve([]);
      }
      if (channel === "resume:upload") {
        return Promise.resolve({ cancelled: true });
      }
      return Promise.reject(new Error(`unexpected channel: ${channel}`));
    });

    render(<ResumeScreen />);
    await screen.findByText(/No resume uploaded yet/);

    await user.click(screen.getByRole("button", { name: "Upload resume" }));

    expect(mockInvoke).toHaveBeenCalledWith("resume:upload");
  });

  it("refreshes and shows filename and upload date after successful upload", async () => {
    const user = userEvent.setup();
    let resume: Resume | null = null;

    mockInvoke.mockImplementation((channel: string) => {
      if (channel === "db:query") {
        return Promise.resolve(resume ? [resume] : []);
      }
      if (channel === "resume:upload") {
        resume = sampleResume;
        return Promise.resolve({ resume: sampleResume });
      }
      return Promise.reject(new Error(`unexpected channel: ${channel}`));
    });

    render(<ResumeScreen />);
    await screen.findByText(/No resume uploaded yet/);

    await user.click(screen.getByRole("button", { name: "Upload resume" }));

    expect(await screen.findByText("my-resume.pdf")).toBeTruthy();
    expect(screen.getByText(/June 8, 2026/)).toBeTruthy();
  });

  it("shows placeholder when skill_profile is null", async () => {
    mockResumeLoad(sampleResume);

    render(<ResumeScreen />);

    expect(await screen.findByText("my-resume.pdf")).toBeTruthy();
    expect(
      screen.getByText(/Skill profile not yet available/)
    ).toBeTruthy();
    expect(screen.queryByText("Hidden resume body text")).toBeNull();
  });

  it("renders skill_profile text when present", async () => {
    mockResumeLoad(resumeWithProfile);

    render(<ResumeScreen />);

    expect(
      await screen.findByText("TypeScript, React, Node.js")
    ).toBeTruthy();
  });

  it("shows error banner when resume:upload returns error", async () => {
    const user = userEvent.setup();
    mockResumeLoad(null);

    mockInvoke.mockImplementation((channel: string) => {
      if (channel === "db:query") {
        return Promise.resolve([]);
      }
      if (channel === "resume:upload") {
        return Promise.resolve({
          error: "No text could be extracted from this file.",
        });
      }
      return Promise.reject(new Error(`unexpected channel: ${channel}`));
    });

    render(<ResumeScreen />);
    await screen.findByText(/No resume uploaded yet/);

    await user.click(screen.getByRole("button", { name: "Upload resume" }));

    expect(
      (await screen.findByRole("alert")).textContent
    ).toBe("No text could be extracted from this file.");
  });

  it("cancelled upload shows no error", async () => {
    const user = userEvent.setup();
    mockResumeLoad(null);

    mockInvoke.mockImplementation((channel: string) => {
      if (channel === "db:query") {
        return Promise.resolve([]);
      }
      if (channel === "resume:upload") {
        return Promise.resolve({ cancelled: true });
      }
      return Promise.reject(new Error(`unexpected channel: ${channel}`));
    });

    render(<ResumeScreen />);
    await screen.findByText(/No resume uploaded yet/);

    await user.click(screen.getByRole("button", { name: "Upload resume" }));

    await waitFor(() => {
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });

  it("shows error when db:query fails on load", async () => {
    mockInvoke.mockResolvedValue({ error: "database locked" });

    render(<ResumeScreen />);

    expect((await screen.findByRole("alert")).textContent).toBe(
      "database locked"
    );
  });

  it("replace button invokes resume:upload when resume exists", async () => {
    const user = userEvent.setup();
    mockResumeLoad(sampleResume);

    mockInvoke.mockImplementation((channel: string) => {
      if (channel === "db:query") {
        return Promise.resolve([sampleResume]);
      }
      if (channel === "resume:upload") {
        return Promise.resolve({ cancelled: true });
      }
      return Promise.reject(new Error(`unexpected channel: ${channel}`));
    });

    render(<ResumeScreen />);
    await screen.findByText("my-resume.pdf");

    await user.click(screen.getByRole("button", { name: "Replace resume" }));

    expect(mockInvoke).toHaveBeenCalledWith("resume:upload");
  });
});
