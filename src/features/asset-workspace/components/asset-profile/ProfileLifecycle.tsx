"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType, type ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  CalendarIcon, CheckIcon, ChevronDownIcon, ClipboardIcon, DisposeIcon, RetireIcon, WarrantyIcon,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Skeleton } from "@/components/ui/Skeleton";
import { lifecycleMenu } from "../../domain/asset-lifecycle-actions";
import { LIFECYCLE_STEP_TONE } from "../../domain/status-tone";
import {
  LIFECYCLE_STEPS, lifecycleStepEntry, lifecycleSteps, profileWarranty, warrantyRemaining, type LifecycleStepState,
} from "../../domain/asset-profile-display.mts";
import { inAssignments, profileHref } from "../../domain/assignment-assign";
import { useProfileRead } from "../../hooks/use-asset-profile";
import { getAssetStatusHistory, getAssetWarranties } from "../../services/asset-profile-api";
import type { AssetDetail, AssetStatusChange } from "../../services/asset-profile-contract";
import { formatDate, formatDay, SectionMessage, StatusValue, todayInBangkok } from "./ProfileParts";

// The tone comes from status-tone.ts; this only maps a tone to the step card surface.
const TONE_CARD = {
  green: "bg-success-muted text-success",
  blue: "bg-accent text-accent-foreground",
  zinc: "bg-muted/60 text-muted-foreground",
  yellow: "bg-warning-muted",
  red: "bg-error-muted",
} as const;
type Icon = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;

function LifecycleCard({ icon: Icon, title, action, children }: { icon: Icon; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card role="region" aria-label={title} className="@container/lifecycle min-w-0 space-y-3 p-4 text-xs focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon aria-hidden="true" className="size-4 shrink-0" />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="space-y-2">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] items-baseline gap-3">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="min-w-0 whitespace-pre-wrap wrap-anywhere text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

type History = { rows: AssetStatusChange[] | null; complete: boolean; pending: boolean; failed: boolean; reload: () => void };

function stepDetail(index: number, state: LifecycleStepState, asset: AssetDetail, history: History) {
  const step = LIFECYCLE_STEPS[index];
  // Step 1 is when the asset entered the register; later steps use their newest status change.
  const since = index === 0 ? asset.registrationDate
    : history.rows ? lifecycleStepEntry(history.rows, step.statuses)?.at ?? null : null;
  const date = state === "Not Started" || !since ? "–" : state === "Current" ? `${formatDay(since)} – Present` : formatDay(since);
  const holder = asset.custody?.name
    ? `Assigned to ${asset.custody.name}${asset.custody.department?.name ? ` (${asset.custody.department.name})` : ""}` : null;
  const description = [
    "Registered in system and ready to assign",
    state === "Current" && asset.lifecycleStatus === "In Maintenance" ? "Under maintenance or repair"
      : state === "Current" && holder ? holder : "Assigned to a holder or in maintenance",
    "End of use; can be disposed",
    "Disposed and removed from use",
  ][index];
  return { date, description };
}

function LifecycleStepper({ asset, history }: { asset: AssetDetail; history: History }) {
  // Only the full history can prove a step was skipped; step 1 is registration, always passed.
  const entered = history.complete && history.rows
    ? LIFECYCLE_STEPS.map((step, index) => index === 0 || lifecycleStepEntry(history.rows!, step.statuses) !== null) : null;
  const states = lifecycleSteps(asset.lifecycleStatus, entered);
  return (
    <LifecycleCard icon={ClipboardIcon} title="Asset Lifecycle">
      <ol className="grid grid-cols-1 gap-3 @lg/lifecycle:grid-cols-4">
        {LIFECYCLE_STEPS.map((step, index) => {
          const state = states[index];
          const { date, description } = stepDetail(index, state, asset, history);
          const reached = state !== "Not Started";
          const nextReached = states[index + 1] && states[index + 1] !== "Not Started";
          return (
            <li key={step.label} aria-current={state === "Current" ? "step" : undefined} className="relative flex min-w-0 flex-col items-center gap-1 text-center">
              {index < LIFECYCLE_STEPS.length - 1 && (
                <span aria-hidden="true" className={`absolute top-3 left-1/2 hidden w-full border-t-2 @lg/lifecycle:block ${nextReached
                  ? "border-success" : "border-dashed border-border"}`} />
              )}
              <span aria-hidden="true" className={`relative grid size-6 place-items-center rounded-full ${state === "Completed"
                ? "bg-success text-success-foreground" : state === "Current" ? "bg-success text-success-foreground ring-4 ring-success-muted"
                  : "border-2 border-border bg-card"}`}>
                {reached && <CheckIcon className="size-3.5" />}
              </span>
              <span className="font-semibold text-foreground">{step.label}</span>
              <span className="tabular-nums text-muted-foreground">{history.pending && !history.rows ? <Skeleton className="h-3 w-20" /> : date}</span>
              <div className={`mt-1 flex w-full flex-1 flex-col items-center gap-1 rounded-control p-2 ${TONE_CARD[LIFECYCLE_STEP_TONE[state]]}`}>
                <Badge color={LIFECYCLE_STEP_TONE[state]} variant="pill" className="whitespace-nowrap">{state}</Badge>
                <span className="wrap-anywhere">{description}</span>
              </div>
            </li>
          );
        })}
      </ol>
      {history.failed && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
          <SectionMessage>Couldn&apos;t load status dates.</SectionMessage>
          <Button size="sm" variant="outline" onClick={history.reload}>Retry</Button>
        </div>
      )}
    </LifecycleCard>
  );
}

function KeyDates({ asset, history }: { asset: AssetDetail; history: History }) {
  const since = history.rows ? lifecycleStepEntry(history.rows, [asset.lifecycleStatus])?.at ?? null : null;
  const tiles: [string, string][] = [
    ["Acquisition Date", formatDate(asset.acquisitionDate)],
    ["Registration Date", formatDay(asset.registrationDate)],
    ["Status Since", formatDay(since)],
    ["Last Updated", formatDay(asset.updatedAt)],
  ];
  return (
    <LifecycleCard icon={CalendarIcon} title="Key Dates">
      <dl className="grid grid-cols-1 gap-3 @md/lifecycle:grid-cols-2 @xl/lifecycle:grid-cols-4">
        {tiles.map(([label, value]) => (
          <div key={label} className="flex min-w-0 items-center gap-3">
            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-control bg-muted text-foreground">
              <CalendarIcon className="size-4" />
            </span>
            <div className="min-w-0">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-semibold tabular-nums text-foreground">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </LifecycleCard>
  );
}

function WarrantyInformation({ context, asset }: { context: string; asset: AssetDetail }) {
  const [open, setOpen] = useState(false);
  const warranties = useProfileRead(`${context}:${asset.id}:warranties`, (signal) => getAssetWarranties(context, asset.id, signal), open);
  const current = asset.currentWarranty;
  const state = current ? profileWarranty(current.expiryStatus) : null;
  const remaining = current && current.expiryStatus !== "Expired" ? warrantyRemaining(current.endDate, todayInBangkok()) : null;
  const earlier = warranties.result?.ok ? warranties.result.data.filter((warranty) => !warranty.isCurrent) : [];
  return (
    <LifecycleCard icon={WarrantyIcon} title="Warranty Information">
      {current && state ? (
        <Rows rows={[
          ["Warranty Status", <Badge key="status" variant="pill" color={state.tone}>{state.label}</Badge>],
          ["Warranty Type", current.type || "—"],
          ["Provider", current.provider || "—"],
          ["Start Date", formatDate(current.startDate)],
          ["End Date", (
            <span key="end" className="inline-flex flex-wrap items-center gap-2">
              {formatDate(current.endDate)}
              {remaining && <Badge variant="pill" color="yellow">{remaining}</Badge>}
            </span>
          )],
          ["Reference No.", current.referenceNo || "—"],
          ["Coverage", current.coverageNote || "—"],
        ]} />
      ) : <SectionMessage>No warranty recorded.</SectionMessage>}
      <details className="group/disclosure border-t border-border pt-2" onToggle={(event) => { if (event.currentTarget.open) setOpen(true); }}>
        <summary className="flex min-h-8 w-fit cursor-pointer list-none items-center gap-1 rounded-control font-medium text-accent-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-sm:min-h-10 [&::-webkit-details-marker]:hidden">
          Earlier warranties
          <ChevronDownIcon aria-hidden="true" className="size-3.5 transition-transform group-open/disclosure:rotate-180 motion-reduce:transition-none" />
        </summary>
        <div className="mt-2 space-y-2">
          {!warranties.result ? <Skeleton className="h-4 w-full" /> : !warranties.result.ok ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SectionMessage tone="error">Couldn&apos;t load earlier warranties.</SectionMessage>
              <Button size="sm" variant="outline" disabled={warranties.pending} onClick={warranties.reload}>Retry</Button>
            </div>
          ) : earlier.length ? earlier.map((warranty) => (
            <div key={warranty.id} className="rounded-control border border-border p-3">
              <Rows rows={[
                ["Provider", warranty.provider || "—"],
                ["Period", `${formatDate(warranty.startDate)} – ${formatDate(warranty.endDate)}`],
                ["Warranty Type", warranty.type || "—"],
                ["Reference No.", warranty.referenceNo || "—"],
              ]} />
            </div>
          )) : <SectionMessage>No earlier warranties.</SectionMessage>}
        </div>
      </details>
    </LifecycleCard>
  );
}

/** Same availability as the More menu (`lifecycleMenu`); no button when neither action is open. */
function Disposal({ asset, history }: { asset: AssetDetail; history: History }) {
  const profile = profileHref(asset.id, inAssignments(usePathname()));
  const open = lifecycleMenu(asset).find(({ action, reason }) => action !== "change-status" && !reason);
  const ActionIcon = open?.action === "dispose" ? DisposeIcon : RetireIcon;
  const disposed = history.rows?.find((row) => row.action === "dispose") ?? null;
  return (
    <LifecycleCard icon={DisposeIcon} title="Disposal / Decommissioning" action={open && (
      <Button asChild variant="outline" size="sm" className="max-sm:h-10">
        <Link href={`${profile}/${open.action}`}>
          <ActionIcon aria-hidden="true" className="size-4" />
          {open.action === "dispose" ? "Dispose Asset" : "Retire Asset"}
        </Link>
      </Button>
    )}>
      <Rows rows={[
        ["Current Status", <StatusValue key="status" status={asset.lifecycleStatus} />],
        ["Disposal Date", disposed ? formatDay(disposed.at) : "—"],
        ["Reason", disposed?.reason || "—"],
        ["Notes", disposed?.notes || "—"],
      ]} />
    </LifecycleCard>
  );
}

export function ProfileLifecycle({ context, asset }: { context: string; asset: AssetDetail }) {
  // Newest 100 status changes date the steps, Status Since and the disposal (BE 01); no new endpoint.
  const read = useProfileRead(`${context}:${asset.id}:lifecycle-status:${asset.updatedAt}`,
    (signal) => getAssetStatusHistory(context, asset.id, 1, null, signal, 100));
  const history: History = {
    rows: read.result?.ok ? read.result.data.data : null,
    complete: Boolean(read.result?.ok && read.result.data.totalPages <= 1),
    pending: read.pending,
    failed: Boolean(read.result && !read.result.ok),
    reload: read.reload,
  };
  return (
    <div className="@container/lifecycle-tab min-w-0">
      <div className="grid min-w-0 items-start gap-3 @4xl/lifecycle-tab:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-3">
          <LifecycleStepper asset={asset} history={history} />
          <KeyDates asset={asset} history={history} />
        </div>
        <div className="min-w-0 space-y-3">
          <WarrantyInformation context={context} asset={asset} />
          <Disposal asset={asset} history={history} />
        </div>
      </div>
    </div>
  );
}
