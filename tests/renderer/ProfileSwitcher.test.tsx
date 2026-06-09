import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import ProfileSwitcher from "../../src/renderer/components/ProfileSwitcher";

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

describe("ProfileSwitcher", () => {
  it("renders active profile name", async () => {
    mockInvoke.mockResolvedValue([
      { id: "p1", name: "Default", active: true },
      { id: "p2", name: "Work", active: false },
    ]);

    render(<ProfileSwitcher />);

    expect(await screen.findByText("Default")).toBeTruthy();
  });

  it("renders chevron icon beside active profile name", async () => {
    mockInvoke.mockResolvedValue([
      { id: "p1", name: "Default", active: true },
      { id: "p2", name: "Work", active: false },
    ]);

    render(<ProfileSwitcher />);

    await screen.findByText("Default");
    const trigger = screen.getByRole("button");
    expect(trigger.querySelector('svg[aria-hidden="true"]')).toBeTruthy();
  });

  it("opens dropdown and lists profiles", async () => {
    mockInvoke.mockResolvedValue([
      { id: "p1", name: "Default", active: true },
      { id: "p2", name: "Work", active: false },
    ]);

    const user = userEvent.setup();
    render(<ProfileSwitcher />);

    await screen.findByText("Default");
    await user.click(screen.getByRole("button"));

    expect(await screen.findByText("Work")).toBeTruthy();
    expect(screen.getByText("New profile")).toBeTruthy();
  });

  it("calls profiles:switch with correct id", async () => {
    mockInvoke.mockImplementation((channel: string, id?: string) => {
      if (channel === "profiles:list") {
        return Promise.resolve([
          { id: "p1", name: "Default", active: true },
          { id: "p2", name: "Work", active: false },
        ]);
      }
      if (channel === "profiles:switch" && id === "p2") {
        return Promise.resolve(undefined);
      }
      return Promise.reject(new Error("unexpected"));
    });

    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload: reloadMock },
    });

    const user = userEvent.setup();
    render(<ProfileSwitcher />);

    await screen.findByText("Default");
    await user.click(screen.getByRole("button"));
    await user.click(await screen.findByText("Work"));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("profiles:switch", "p2");
    });

    expect(reloadMock).toHaveBeenCalled();
  });

  it("shows graceful error state on IPC reject", async () => {
    mockInvoke.mockRejectedValue(new Error("IPC unavailable"));

    render(<ProfileSwitcher />);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("Unable to load profiles");
  });
});
