import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, ClockIcon, XIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { ASSET_STATUSES, type AssetStatus } from "../../domain/asset-status";
import { assignmentHistoryDate } from "../../domain/assignment-history";
import type { AssetStatusChange } from "../../services/asset-profile-contract";
import { ConditionValue, StatusValue } from "./ProfileParts";

/** PO statuses get the shared badge; any other stored value is shown as is with a Legacy tag (conflict C10). */
export function StatusHistoryValue({ status }: { status: string | null }) {
  if (!status) return <span>—</span>;
  if (ASSET_STATUSES.includes(status as AssetStatus)) return <StatusValue status={status} />;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <StatusValue status={status} />
      <Badge color="zinc" variant="pill">Legacy</Badge>
    </span>
  );
}

function BeforeAfter({ label, before, after }: { label: string; before: ReactNode; after: ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-muted-foreground">{label}</h3>
      <dl className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
        <div className="space-y-1">
          <dt className="text-2xs text-muted-foreground">Before</dt>
          <dd>{before}</dd>
        </div>
        <ArrowRightIcon aria-hidden="true" className="mt-5 size-4 text-muted-foreground" />
        <div className="space-y-1">
          <dt className="text-2xs text-muted-foreground">After</dt>
          <dd>{after}</dd>
        </div>
      </dl>
    </div>
  );
}

export function ProfileStatusHistoryPanel({ change, onClose }: { change: AssetStatusChange; onClose: () => void }) {
  const time = assignmentHistoryDate(change.at);
  return (
    <Card role="complementary" aria-label="Status Change Detail"
      className="min-w-0 space-y-4 overscroll-contain p-4 text-xs focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <ClockIcon aria-hidden="true" className="size-4 shrink-0" />
          <span className="min-w-0 truncate">Status Change Detail</span>
        </h2>
        <Button variant="ghost" size="icon-sm" aria-label="Close status change detail" onClick={onClose}>
          <XIcon aria-hidden="true" className="size-4" />
        </Button>
      </div>
      <div className="space-y-1 rounded-control bg-accent/50 p-3">
        <p className="flex flex-wrap items-center gap-1 font-semibold">
          Status changed to <StatusHistoryValue status={change.toStatus} />
        </p>
        <time dateTime={change.at} className="block tabular-nums text-muted-foreground">{time.date} {time.time}</time>
      </div>
      <BeforeAfter label="Status" before={<StatusHistoryValue status={change.fromStatus} />}
        after={<StatusHistoryValue status={change.toStatus} />} />
      <BeforeAfter label="Condition" before={<ConditionValue condition={change.fromCondition} />}
        after={<ConditionValue condition={change.toCondition} />} />
      <dl className="space-y-3 border-t border-border pt-3">
        <div className="space-y-1">
          <dt className="text-muted-foreground">Changed By</dt>
          <dd className="font-semibold wrap-anywhere">{change.actorName || "System"}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground">Reason</dt>
          <dd className="whitespace-pre-wrap wrap-anywhere">{change.reason || "—"}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground">Notes</dt>
          <dd className="whitespace-pre-wrap rounded-control bg-muted/60 p-3 wrap-anywhere">{change.notes || "—"}</dd>
        </div>
      </dl>
    </Card>
  );
}
