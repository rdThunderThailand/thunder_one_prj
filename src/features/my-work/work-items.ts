import type { DraftPublicationRow, PartnerApplicationRow, RosterMemberRow } from "./services/work-sources-api";

/**
 * My Work's single item model — every list, tile and chart on all three page
 * variants reads from `MyWork`, built by `buildMyWork` from the real Core
 * sources in `services/work-sources-api.ts`. There is no priority,
 * assignee or project on any Core source, so the model has none either.
 */
export type WorkItemKind = "approval" | "task" | "draft" | "waiting";
export type DueGroup = "overdue" | "due-today" | "upcoming" | "no-due";

export interface WorkItem {
  id: string;
  kind: WorkItemKind;
  title: string;
  detail: string;
  /** Where the item lives — shown instead of the old mock project/team. */
  source: string;
  href: string;
  /** A real deadline when the source has one (a draft's schedule start);
   *  `null` otherwise — never an invented due date. */
  dueAt: string | null;
  dateNote: string;
}

export interface CompletedItem {
  id: string;
  title: string;
  completedAt: string;
}

export interface MyWork {
  items: WorkItem[];
  completed: CompletedItem[];
  /** Per kind: `false` when its source failed or this user can't read it
   *  (Core answers 403 and `coreGet` can't tell that apart from a failure),
   *  so tiles show "-" rather than a misleading 0. */
  available: Record<WorkItemKind, boolean>;
}

/**
 * `admin` — CEO/admin and manager variants: everything, including
 * tenant-wide follow-ups (invites, onboarding). `personal` — employee
 * variant: only what is addressed to this user (their drafts, and reviews if
 * they happen to be a reviewer).
 */
export type WorkScope = "admin" | "personal";

const DATE_FMT: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" };

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-GB", DATE_FMT);
}

/** yyyy-mm-dd in Bangkok time — the calendar day the user actually sees. */
function bangkokDay(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

export function dueGroup(item: WorkItem, now: Date): DueGroup {
  if (!item.dueAt) return "no-due";
  const due = new Date(item.dueAt);
  if (Number.isNaN(due.getTime())) return "no-due";
  const dueDay = bangkokDay(due);
  const today = bangkokDay(now);
  if (dueDay < today) return "overdue";
  if (dueDay === today) return "due-today";
  return "upcoming";
}

export function countByGroup(items: WorkItem[], now: Date): Record<DueGroup, number> {
  const counts: Record<DueGroup, number> = { overdue: 0, "due-today": 0, upcoming: 0, "no-due": 0 };
  for (const item of items) counts[dueGroup(item, now)] += 1;
  return counts;
}

/** Most urgent first: overdue → due today → upcoming (earliest first) → no due date. */
export function sortByUrgency(items: WorkItem[]): WorkItem[] {
  return [...items].sort((a, b) => {
    if (a.dueAt && b.dueAt) return a.dueAt.localeCompare(b.dueAt);
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return 0;
  });
}

function memberName(row: RosterMemberRow): string {
  return row.user?.full_name?.trim() || "A member";
}

export function buildMyWork(
  sources: {
    partnerApplications: PartnerApplicationRow[] | null;
    roster: RosterMemberRow[] | null;
    drafts: DraftPublicationRow[] | null;
  },
  userId: string | null,
  scope: WorkScope
): MyWork {
  const items: WorkItem[] = [];
  const completed: CompletedItem[] = [];

  for (const app of sources.partnerApplications ?? []) {
    const tenantName = app.tenant?.name ?? app.external_application_id;
    if (app.status === "PENDING") {
      items.push({
        id: `partner-${app.id}`,
        kind: "approval",
        title: `Review partner application — ${tenantName}`,
        detail: app.applicant?.name ?? app.applicant?.email ?? "Unknown applicant",
        source: "Lead Approval",
        href: "/lead-approval",
        dueAt: null,
        dateNote: `Submitted ${formatDate(app.submitted_at)}`,
      });
    } else if (app.reviewed_at && userId && app.actor_id === userId) {
      const verb = app.status === "APPROVED" ? "Approved" : app.status === "REJECTED" ? "Rejected" : "Requested info on";
      completed.push({ id: `partner-${app.id}`, title: `${verb} partner application — ${tenantName}`, completedAt: app.reviewed_at });
    }
  }

  if (scope === "admin") {
    for (const member of sources.roster ?? []) {
      if (member.status === "invited") {
        items.push({
          id: `invite-${member.id}`,
          kind: "waiting",
          title: `${memberName(member)} hasn't accepted the invite yet`,
          detail: "Invited member",
          source: "People · Personnel",
          href: "/people/personnel",
          dueAt: null,
          dateNote: `Invited ${formatDate(member.joined_at)}`,
        });
      } else if (member.status === "active" && member.onboarding && member.onboarding.done < member.onboarding.total) {
        items.push({
          id: `onboarding-${member.id}`,
          kind: "task",
          title: `Finish onboarding for ${memberName(member)}`,
          detail: `${member.onboarding.done} of ${member.onboarding.total} steps done`,
          source: "People · New hires",
          href: "/people/new-hires",
          dueAt: null,
          dateNote: member.start_date ? `Start date ${formatDate(member.start_date)}` : "No start date",
        });
      }
    }
  }

  for (const draft of sources.drafts ?? []) {
    if (!userId || draft.created_by?.id !== userId) continue;
    items.push({
      id: `draft-${draft.id}`,
      kind: "draft",
      title: `Publish draft — ${draft.name}`,
      detail: "Unpublished publication",
      source: "Media Workspace",
      href: `/media-workspace/publications/${draft.id}`,
      dueAt: draft.starts_at ?? null,
      dateNote: draft.starts_at
        ? `Scheduled to start ${formatDate(draft.starts_at)}`
        : draft.updated_at
          ? `Last edited ${formatDate(draft.updated_at)}`
          : "Not scheduled",
    });
  }

  completed.sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  return {
    items: sortByUrgency(items),
    completed,
    available: {
      approval: sources.partnerApplications !== null,
      task: scope === "admin" && sources.roster !== null,
      waiting: scope === "admin" && sources.roster !== null,
      draft: sources.drafts !== null && userId !== null,
    },
  };
}

/** Everything unavailable — for a session with no token/tenant. */
export const EMPTY_MY_WORK: MyWork = {
  items: [],
  completed: [],
  available: { approval: false, task: false, waiting: false, draft: false },
};
