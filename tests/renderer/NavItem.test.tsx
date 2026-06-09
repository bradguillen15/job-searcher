import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import NavItem from "../../src/renderer/components/NavItem";
import { Settings } from "lucide-react";

function renderNavItem(initialPath: string): void {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <NavItem to="/settings" icon={Settings} label="Settings" />
    </MemoryRouter>
  );
}

describe("NavItem", () => {
  it("active link has accent classes", () => {
    renderNavItem("/settings");
    const link = screen.getByRole("link", { name: "Settings" });
    expect(link.className).toContain("text-accent");
    expect(link.className).toContain("bg-accent/10");
  });

  it("inactive link does not have accent classes", () => {
    renderNavItem("/");
    const link = screen.getByRole("link", { name: "Settings" });
    expect(link.className).not.toContain("text-accent");
    expect(link.className).not.toContain("bg-accent/10");
  });

  it("renders icon and label text", () => {
    renderNavItem("/settings");
    const link = screen.getByRole("link", { name: "Settings" });
    expect(link.querySelector('svg[aria-hidden="true"]')).toBeTruthy();
    expect(link.textContent).toContain("Settings");
  });
});
