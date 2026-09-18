import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
      className={`${className} ${active ? "bg-primary-soft text-primary" : "text-sidebar-foreground hover:bg-accent"}`}
    >
      {content}
    </Link>
  );
}

export function MediaWorkspaceBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <>
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-9 w-9 shrink-0"
        aria-hidden="true"
      >
        <rect width="200" height="200" rx="44" fill="#010F29" />
        <g transform="translate(40 53.4) scale(1.92)">
          <path
            d="M62.5277 4.82971L52.1716 43.9017H38.9355L46.4714 16.0402H39.805L49.2732 4.82971H62.5277Z"
            fill="url(#media_sidebar_logo_gradient)"
          />
          <path
            d="M33.2354 15.8467H0L2.99512 4.63965H42.7031L33.2354 15.8467Z"
            fill="white"
          />
          <path
            d="M27.4442 11.5132L19.1298 43.8647H5.89343L15.1473 8.31104L27.4442 11.5132Z"
            fill="white"
          />
        </g>
        <defs>
          <linearGradient
            id="media_sidebar_logo_gradient"
            x1="57.7753"
            y1="18.9386"
            x2="37.0998"
            y2="35.4597"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.466346" stopColor="#1165B7" />
            <stop offset="0.495192" stopColor="#0A50BA" />
          </linearGradient>
        </defs>
      </svg>
      {!collapsed && (
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-extrabold leading-none text-foreground">
            ThunderOne
          </span>
          <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
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
        className={`mb-3 flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold hover:bg-accent ${
          overviewActive ? "bg-primary-soft text-primary" : "text-foreground"
        } ${collapsed ? "justify-center" : ""}`}
      >
        <span className="h-4 w-4 shrink-0">{nav.overviewItem.icon}</span>
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
