import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { CalendarIcon, ChevronRightIcon } from "@/components/ui/icons";
import { Avatar } from "@/features/asset-workspace/components/inventory/parts";
import { SessionHeaderActions, SessionTabs } from "@/features/asset-workspace/components/inventory/SessionDetailNav";
import { ErrorState } from "@/features/asset-workspace/components/states/ErrorState";
import { NotFoundState } from "@/features/asset-workspace/components/states/states";
import { bangkokToday, dueHint, sessionProgress } from "@/features/asset-workspace/domain/inventory";
import { SESSION_STATUS_TONE } from "@/features/asset-workspace/domain/status-tone";
import { getInventorySession } from "@/features/asset-workspace/services/asset-inventory-api";

const LIST = "/asset-workspace/inventory";
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

// Inventory session detail shell (05 §4.9 · checklist §1 I2): header + tabs on every tab. No "INV-…" id (§5).
export default async function SessionDetailLayout({ children, params }: {
  children: ReactNode;
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await getInventorySession(sessionId);
  const back = (
    <Link
      href={LIST}
      className="text-sm font-medium text-primary hover:underline"
    >
      Back to Inventory
    </Link>
  );

  if (session === "not-found") {
    return (
      <div className="p-6">
        <NotFoundState
          title="Session not found"
          body="This inventory session doesn't exist or isn't assigned to you."
          action={back}
        />
      </div>
    );
  }
  if (!session) {
    return (
      <div className="p-6">
        <ErrorState />
      </div>
    );
  }
  if (session.status === "Draft") redirect(`${LIST}/${session.id}/setup`);

  const hint = session.status === "In Progress" ? dueHint(session.dueDate, bangkokToday()) : null;
  const due = session.dueDate ? dateFmt.format(new Date(session.dueDate)) : "—";
  const start = session.startedAt ? dateFmt.format(new Date(session.startedAt)) : "—";
  const subtitle = [session.scopeLabel, due !== "—" ? due : null].filter(Boolean);

  return (
    <div className="space-y-4 p-6">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <Link
          href={LIST}
          className="hover:text-foreground hover:underline"
        >
          Inventory
        </Link>
        <ChevronRightIcon
          aria-hidden="true"
          className="h-3 w-3"
        />
        <span
          aria-current="page"
          className="min-w-0 truncate font-medium text-foreground"
        >
          {session.name}
        </span>
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="min-w-0 space-y-2">
          <h1 className="flex flex-wrap items-center gap-3 text-xl font-extrabold tracking-tight text-foreground">
            {session.name}
            <Badge
              variant="pill"
              color={SESSION_STATUS_TONE[session.status]}
            >
              {session.status}
            </Badge>
          </h1>
          {subtitle.length > 0 && <p className="text-sm text-muted-foreground">{subtitle.join("  |  ")}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <dl className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <div className="space-y-1">
              <dt className="text-muted-foreground">Owner</dt>
              <dd className="flex items-center gap-2">
                {session.owner ? (
                  <>
                    <Avatar name={session.owner.name} />
                    <span className="min-w-0">
                      <span className="block max-w-40 truncate font-semibold">{session.owner.name}</span>
                      <span className="text-xs text-muted-foreground">Asset Admin</span>
                    </span>
                  </>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="space-y-1 border-l border-border pl-6">
              <dt className="text-muted-foreground">Start Date</dt>
              <dd className="flex items-center gap-2">
                <CalendarIcon
                  aria-hidden="true"
                  className="h-4 w-4 text-muted-foreground"
                />
                {start}
              </dd>
            </div>
            <div className="space-y-1 border-l border-border pl-6">
              <dt className="text-muted-foreground">Due Date</dt>
              <dd>
                <span className="flex items-center gap-2">
                  <CalendarIcon
                    aria-hidden="true"
                    className="h-4 w-4 text-muted-foreground"
                  />
                  {due}
                </span>
                {hint && <span className="block text-xs text-t1-red-700">{hint.text}</span>}
              </dd>
            </div>
          </dl>
          <SessionHeaderActions session={session} />
        </div>
      </div>
      <SessionTabs
        sessionId={session.id}
        discrepancies={sessionProgress(session.counts).discrepancies}
      />
      {children}
    </div>
  );
}
