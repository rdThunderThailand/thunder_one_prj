import Link from "next/link";
import type { NavConfig, NavItem } from "@/config/nav/types";

const PRIMARY = "oklch(0.58 0.22 262)";
const PRIMARY_SOFT = "oklch(0.965 0.028 262)";
const FOREGROUND = "oklch(0.205 0.035 265)";
const SIDEBAR_FOREGROUND = "oklch(0.129 0.042 264.695)";
const MUTED = "oklch(0.5 0.03 262)";

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
        isAlert ? "bg-red-500 text-white" : "bg-indigo-100 text-indigo-600"
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
      <span className="h-4 w-4 shrink-0" style={{ color: MUTED }}>
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
        className={`${className} cursor-not-allowed opacity-60`}
        style={{ color: MUTED }}
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
      className={`${className} hover:bg-[oklch(0.968_0.007_247.896)]`}
      style={active ? { background: PRIMARY_SOFT, color: PRIMARY } : { color: SIDEBAR_FOREGROUND }}
    >
      {content}
    </Link>
  );
}

export function MediaWorkspaceBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <>
      <span
        className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg text-sm font-black italic text-white"
        style={{ background: PRIMARY }}
      >
        T1
      </span>
      {!collapsed && (
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-extrabold leading-none" style={{ color: FOREGROUND }}>
            ThunderOne
          </span>
          <span
            className="mt-1 block text-[9px] font-bold uppercase tracking-[0.18em]"
            style={{ color: MUTED }}
          >
            Media workspace
          </span>
        </span>
      )}
    </>
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
        className={`mb-3 flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold hover:bg-[oklch(0.968_0.007_247.896)] ${
          collapsed ? "justify-center" : ""
        }`}
        style={overviewActive ? { background: PRIMARY_SOFT, color: PRIMARY } : { color: FOREGROUND }}
      >
        <span className="h-4 w-4 shrink-0">{nav.overviewItem.icon}</span>
        {!collapsed && <span>{nav.overviewItem.label}</span>}
      </Link>

      {nav.sections.map((section) => (
        <section key={section.label} className="mb-4">
          {!collapsed && (
            <p className="mb-1.5 px-3 text-[9px] font-bold uppercase" style={{ color: MUTED }}>
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
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 4v16" stroke="currentColor" strokeWidth="1.8" />
      <path
        d={open ? "m14 9 3 3-3 3" : "m16 9-3 3 3 3"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
