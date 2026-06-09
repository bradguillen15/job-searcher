import React from "react";
import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
}

function NavItem({ to, icon: Icon, label }: NavItemProps): React.JSX.Element {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted transition-colors [-webkit-app-region:no-drag]",
          isActive ? "bg-accent/10 text-accent" : "hover:bg-surface hover:text-foreground"
        )
      }
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  );
}

export default NavItem;
