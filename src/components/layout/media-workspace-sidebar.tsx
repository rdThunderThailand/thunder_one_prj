import Link from "next/link";
import {
  PanelCloseIcon as PanelLeftClose,
  PanelOpenIcon as PanelLeftOpen,
} from "@/components/ui/icons";
import type { NavConfig, NavItem } from "@/config/nav/types";

function isActivePath(pathname: string, href?: string) {
  if (!href) return false;
  if (href === "/media-workspace") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavBadge({ badge }: { badge?: string }) {
  if (!badge) return null;

  const isAlert = /^\d+$/.test(badge);
  return (
    <span
      className={`ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase ${
        isAlert ? "bg-error text-error-foreground" : "bg-accent text-primary"
      }`}
    >
      {badge}
    </span>
  );
}

function NavLink({ item, pathname, collapsed }: { item: NavItem; pathname: string; collapsed: boolean }) {
  const active = isActivePath(pathname, item.href);
  const content = (
    <>
      <span className="h-4 w-4 shrink-0 text-muted-foreground">
        {item.icon}
      </span>
      {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
      {!collapsed && <NavBadge badge={item.badge} />}
    </>
  );
  const className = `flex h-8 w-full items-center gap-3 rounded-md px-3 text-xs font-medium transition-colors ${
    collapsed ? "justify-center" : ""
  }`;

  if (!item.href) {
    return (
      <span
        className={`${className} cursor-not-allowed text-muted-foreground opacity-60`}
        aria-disabled="true"
        title={collapsed ? item.label : "Not built yet"}
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={`${className} ${active ? "bg-accent text-primary" : "text-sidebar-foreground hover:bg-accent"}`}
    >
      {content}
    </Link>
  );
}

// Logos come from the design system's brand assets (DS-10, brand.md): the horizontal colour
// lockup in the 224×68 logo block, the T1 mark tile when the sidebar is collapsed.
export function MediaWorkspaceBrand({ collapsed }: { collapsed: boolean }) {
  return collapsed ? (
    // eslint-disable-next-line @next/next/no-img-element -- brand SVG, no optimization needed
    <img src="/brand/thunderone-mark-t1-dark.svg" alt="ThunderOne" className="h-8 w-8 max-w-none" />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/thunderone-logo-horizontal-color.svg" alt="ThunderOne" className="h-10 w-auto" />
  );
}

export function MediaWorkspaceNav({ nav, pathname, collapsed }: { nav: NavConfig; pathname: string; collapsed: boolean }) {
  const overviewActive = isActivePath(pathname, nav.overviewItem.href);

  return (
    <nav className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="Main navigation">
      <Link
        href={nav.overviewItem.href!}
        title={collapsed ? nav.overviewItem.label : undefined}
        aria-current={overviewActive ? "page" : undefined}
        className={`mb-3 flex h-8 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition-colors ${
          overviewActive ? "bg-accent text-primary" : "text-sidebar-foreground hover:bg-accent"
        } ${collapsed ? "justify-center" : ""}`}
      >
        <span className={`h-4 w-4 shrink-0 ${overviewActive ? "" : "text-muted-foreground"}`}>{nav.overviewItem.icon}</span>
        {!collapsed && <span>{nav.overviewItem.label}</span>}
      </Link>

      {nav.sections.map((section) => (
        <section key={section.label} className="mb-4">
          {!collapsed && (
            <p className="mb-1.5 px-3 text-[9px] font-bold uppercase text-muted-foreground">
              {section.label}
            </p>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => (
              <NavLink key={item.label} item={item} pathname={pathname} collapsed={collapsed} />
            ))}
          </div>
        </section>
      ))}
    </nav>
  );
}

export function MediaWorkspaceCollapseIcon({ open }: { open: boolean }) {
  const Icon = open ? PanelLeftOpen : PanelLeftClose;
  return <Icon className="h-4 w-4" aria-hidden="true" />;
}
