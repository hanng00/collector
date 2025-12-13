import { Link2, Table2 } from "lucide-react";
import type { ComponentType } from "react";

export interface NavItem {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

export const navItems: NavItem[] = [
  {
    title: "Workspaces",
    icon: Table2,
    href: "/workspaces",
  },
  {
    title: "Share links",
    icon: Link2,
    href: "/links",
  },
];

