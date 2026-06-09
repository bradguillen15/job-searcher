import React from "react";
import {
  Binoculars,
  Briefcase,
  FileText,
  Kanban,
  LayoutGrid,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import NavItem from "@/components/NavItem";
import ProfileSwitcher from "@/components/ProfileSwitcher";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

function Sidebar(): React.JSX.Element {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside
      className="flex h-screen w-[var(--sidebar-width)] shrink-0 flex-col border-r border-border bg-surface"
    >
      <div className="[-webkit-app-region:drag] px-2 pt-3">
        <ProfileSwitcher />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2 py-3">
        <NavItem to="/" icon={Binoculars} label="Scout" />
        <NavItem to="/results" icon={LayoutGrid} label="Results" />
        <NavItem to="/pipeline" icon={Kanban} label="Pipeline" />
        <NavItem to="/boards" icon={Briefcase} label="Boards & Keywords" />
        <NavItem to="/resume" icon={FileText} label="Resume" />
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-border px-2 py-3">
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-2 [-webkit-app-region:no-drag]"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {theme === "dark" ? (
            <Sun className="size-4" aria-hidden="true" />
          ) : (
            <Moon className="size-4" aria-hidden="true" />
          )}
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </Button>
        <NavItem to="/settings" icon={Settings} label="Settings" />
      </div>
    </aside>
  );
}

export default Sidebar;
