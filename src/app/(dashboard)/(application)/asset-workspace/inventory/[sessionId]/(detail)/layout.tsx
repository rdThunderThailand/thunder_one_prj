import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { SessionHeaderActions, SessionTabs } from "@/features/asset-workspace/components/inventory/SessionDetailNav";
import { ErrorState } from "@/features/asset-workspace/components/states/ErrorState";
import { NotFoundState } from "@/features/asset-workspace/components/states/states";
import { bangkokToday, dueHint } from "@/features/asset-workspace/domain/inventory";
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
  const meta: [string, ReactNode][] = [
    ["Owner", session.owner?.name ?? "—"],
    ["Start Date", session.startedAt ? dateFmt.format(new Date(session.startedAt)) : "—"],
    [
      "Due Date",
      <>
        {session.dueDate ? dateFmt.format(new Date(session.dueDate)) : "—"}
        {hint && <span className={`ml-2 ${hint.overdue ? "text-t1-red-700" : "text-muted-foreground"}`}>({hint.text})</span>}
      </>,
    ],
  ];

  return (
    <div className="space-y-3 p-6">
      {back}
      <PageHeader
        title={
          <span className="inline-flex flex-wrap items-center gap-2">
            {session.name}
            <Badge
              variant="pill"
              color={SESSION_STATUS_TONE[session.status]}
            >
              {session.status}
            </Badge>
          </span>
        }
        subtitle={session.scopeLabel || undefined}
        actions={<SessionHeaderActions session={session} />}
      />
      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        {meta.map(([label, value]) => (
          <div
            key={label}
            className="flex gap-1.5"
          >
            <dt className="text-muted-foreground">{label}:</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <SessionTabs sessionId={session.id} />
      {children}
    </div>
  );
}
