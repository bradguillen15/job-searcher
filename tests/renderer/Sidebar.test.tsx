import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "../../src/renderer/components/Sidebar";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "dark";
  Object.defineProperty(window, "api", {
    configurable: true,
    value: {
      invoke: vi
        .fn()
        .mockResolvedValue([{ id: "p1", name: "Default", active: true }]),
    },
  });
});

function findDragRegion(container: HTMLElement): HTMLElement | undefined {
  return Array.from(container.querySelectorAll("div")).find((element) =>
    element.className.includes("[-webkit-app-region:drag]")
  );
}

describe("Sidebar", () => {
  it("marks sidebar header as draggable for Electron window controls", () => {
    const { container } = render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    const dragRegion = findDragRegion(container);
    expect(dragRegion).toBeTruthy();
  });
});
