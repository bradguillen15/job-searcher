import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useScraperProgress,
  type ScraperProgressHandlers,
} from "../../src/renderer/hooks/useScraperProgress";

describe("useScraperProgress", () => {
  const mockOn = vi.fn();
  const mockUnsub = vi.fn();

  const handlers: ScraperProgressHandlers = {
    onLogLine: vi.fn(),
    onBoardStart: vi.fn(),
    onBoardDone: vi.fn(),
    onSelectorRequired: vi.fn(),
    onRunComplete: vi.fn(),
    onRunError: vi.fn(),
    onBoardLogError: vi.fn(),
  };

  beforeEach(() => {
    mockOn.mockReset();
    mockUnsub.mockReset();
    mockOn.mockReturnValue(mockUnsub);

    Object.defineProperty(window, "api", {
      configurable: true,
      value: {
        invoke: vi.fn(),
        on: mockOn,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("subscribes to scraper:progress on mount and unsubscribes on unmount", () => {
    const { unmount } = renderHook(() => useScraperProgress(handlers));

    expect(mockOn).toHaveBeenCalledWith(
      "scraper:progress",
      expect.any(Function)
    );
    expect(mockUnsub).not.toHaveBeenCalled();

    unmount();

    expect(mockUnsub).toHaveBeenCalledTimes(1);
  });
});
