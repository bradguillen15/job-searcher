import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  applyInitialTheme,
  applyThemeToDocument,
  readStoredTheme,
} from "../../src/renderer/hooks/theme";
import { useTheme } from "../../src/renderer/hooks/useTheme";

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("default class is dark", () => {
    applyInitialTheme();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(readStoredTheme()).toBe("dark");
  });

  it("toggles to light", () => {
    applyInitialTheme();
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  it("persists to localStorage", () => {
    applyInitialTheme();
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(localStorage.getItem("theme")).toBe("light");
  });

  it('initialises from localStorage "light"', () => {
    localStorage.setItem("theme", "light");
    applyThemeToDocument(readStoredTheme());

    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(readStoredTheme()).toBe("light");
  });
});
