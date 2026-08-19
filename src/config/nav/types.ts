import type { ReactNode } from "react";

export interface NavItem {
  label: string;
  href?: string; // omit for routes not built yet — renders inert
}

export interface NavSection {
  label: string;
  icon: ReactNode;
  items: NavItem[];
}

export interface PinnedNavItem extends NavItem {
  icon: ReactNode;
}

export interface NavConfig {
  overviewItem: PinnedNavItem;
  sections: NavSection[];
  standaloneLinks: NavItem[];
  standaloneIcons: ReactNode[];
}
