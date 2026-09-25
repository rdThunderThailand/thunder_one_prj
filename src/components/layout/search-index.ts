import { APPS } from "@/config/apps";
import { resolveAssetIntelligenceNav } from "@/config/nav/asset-intelligence";
import { customerWorkspaceNav } from "@/config/nav/customer-workspace";
import { leadApprovalNav } from "@/config/nav/lead-approval";
import { mediaWorkspaceNav } from "@/config/nav/media-workspace";
import { peopleNav } from "@/config/nav/people";
import { settingsNavItems } from "@/config/nav/settings";
import { shellNavItems } from "@/config/nav/shell";
import { resolveThunderCareNav } from "@/config/nav/thunder-care";
import type { NavConfig } from "@/config/nav/types";

// Every navigable page, built from the same nav configs the Sidebar renders
// — so global search can only ever point at pages that exist (items without
// an `href` are "not built yet" and are skipped). Matched client-side,
// instantly, before any Core search comes back.

export interface PageEntry {
  title: string;
  /** Where it lives, e.g. "Media Workspace · Content". */
  context: string;
  href: string;
}

function fromNav(appName: string, nav: NavConfig): PageEntry[] {
  const entries: PageEntry[] = [];
  if (nav.overviewItem.href) entries.push({ title: nav.overviewItem.label, context: appName, href: nav.overviewItem.href });
  for (const section of nav.sections) {
    for (const item of section.items) {
      if (item.href) entries.push({ title: item.label, context: `${appName} · ${section.label}`, href: item.href });
    }
  }
  for (const item of nav.standaloneLinks) {
    if (item.href) entries.push({ title: item.label, context: appName, href: item.href });
  }
  return entries;
}

function buildIndex(): PageEntry[] {
  const all: PageEntry[] = [
    ...shellNavItems.map((item) => ({ title: item.label, context: item.sublabel, href: item.href })),
    ...APPS.map((app) => ({ title: app.tagline, context: "Workspace", href: app.basePath })),
    ...fromNav("Media Workspace", mediaWorkspaceNav),
    ...fromNav("People", peopleNav),
    ...fromNav("Customer Workspace", customerWorkspaceNav),
    ...fromNav("Lead Approval", leadApprovalNav),
    ...["assets", "departments", "my-assets"].flatMap((segment) =>
      fromNav("Asset Intelligence", resolveAssetIntelligenceNav(`/asset-intelligence/${segment}`))
    ),
    ...["work-orders", "service-ops", "dispatch"].flatMap((segment) =>
      fromNav("ThunderCare", resolveThunderCareNav(`/thunder-care/${segment}`))
    ),
    ...settingsNavItems.map((item) => ({ title: item.label, context: "ตั้งค่า", href: item.href })),
  ];
  const seen = new Set<string>();
  return all.filter((entry) => (seen.has(entry.href) ? false : (seen.add(entry.href), true)));
}

export const PAGE_INDEX: PageEntry[] = buildIndex();

/** Title matches first (prefix before substring), then context matches. */
export function matchPages(query: string, limit = 6): PageEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const score = (entry: PageEntry) => {
    const title = entry.title.toLowerCase();
    if (title.startsWith(q)) return 0;
    if (title.includes(q)) return 1;
    if (entry.context.toLowerCase().includes(q) || entry.href.toLowerCase().includes(q)) return 2;
    return -1;
  };
  return PAGE_INDEX.map((entry) => ({ entry, s: score(entry) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => a.s - b.s)
    .slice(0, limit)
    .map((x) => x.entry);
}
