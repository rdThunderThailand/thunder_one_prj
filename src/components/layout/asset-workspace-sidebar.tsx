import Link from "next/link";
import type { ReactNode } from "react";
import type { NavConfig, NavItem } from "@/config/nav/types";

// Asset Workspace's own nav list (Sidebar.tsx picks it, like the Media Workspace one): flat rows,
// each with its icon, section names as small dividers, and icons only (label as tooltip) when
// the sidebar is collapsed. The shell (logo, tenant switcher, collapse button) stays shared.

function isActivePath(pathname: string, href?: string) {
  if (!href) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  icon,
  pathname,
  collapsed,
  strong = false,
}: {
  item: NavItem;
  icon?: ReactNode;
  pathname: string;
  collapsed: boolean;
  strong?: boolean;
}) {
  const active = isActivePath(pathname, item.href);
  const content = (
    <>
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">{icon}</span>
      {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
    </>
  );
  const className = `flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm transition-colors ${
    strong ? "font-semibold" : "font-medium"
  } ${collapsed ? "justify-center" : ""}`;

  if (!item.href) {
    return (
      <span
        className={`${className} cursor-not-allowed select-none bg-t1-gray-50 text-t1-gray-400 opacity-75`}
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
      aria-label={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={`${className} ${
        active ? "bg-accent text-primary" : "text-foreground hover:bg-muted hover:text-primary"
      }`}
    >
      {content}
    </Link>
  );
}

export function AssetWorkspaceNav({
  nav,
  pathname,
  collapsed,
}: {
  nav: NavConfig;
  pathname: string;
  collapsed: boolean;
}) {
  return (
    <nav
      className={`no-scrollbar min-h-0 flex-1 overflow-y-auto pb-4 pt-3 tracking-normal ${collapsed ? "px-3" : "px-2"}`}
      aria-label="Main navigation"
    >
      <NavLink item={nav.overviewItem} icon={nav.overviewItem.icon} pathname={pathname} collapsed={collapsed} strong />

      {nav.sections.map((section) => (
        <section key={section.label} className="mt-4 border-t border-border pt-3 first:mt-0 first:border-t-0">
          {!collapsed && (
            <h2 className="mb-1.5 px-3 text-3xs font-bold uppercase text-muted-foreground">{section.label}</h2>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => (
              <NavLink key={item.label} item={item} icon={item.icon} pathname={pathname} collapsed={collapsed} />
            ))}
          </div>
        </section>
      ))}

      {nav.standaloneLinks.length > 0 && (
        <div className="mt-4 space-y-0.5 border-t border-border pt-3">
          {nav.standaloneLinks.map((item, index) => (
            <NavLink
              key={item.label}
              item={item}
              icon={nav.standaloneIcons[index]}
              pathname={pathname}
              collapsed={collapsed}
            />
          ))}
        </div>
      )}
    </nav>
  );
}
