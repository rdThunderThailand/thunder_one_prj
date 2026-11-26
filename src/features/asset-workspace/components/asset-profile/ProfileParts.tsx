import type { ReactNode } from "react";
import type { Icon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import { ASSET_CONDITIONS, type AssetCondition } from "../../domain/asset-condition";
import { ASSET_STATUSES, type AssetStatus } from "../../domain/asset-status";
import { ConditionBadge, StatusBadge } from "../StatusBadges";

const dateTime = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", hour12: false, timeZone: "Asia/Bangkok" });
const dayFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Asia/Bangkok" });
// Calendar dates (acquisition, warranty) have no time zone; format them as written.
const calendar = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" });
const isoDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" });

export function formatDateTime(value: string | null): string {
  return value && Number.isFinite(Date.parse(value)) ? dateTime.format(new Date(value)) : "—";
}
export function formatDay(value: string | null): string {
  return value && Number.isFinite(Date.parse(value)) ? dayFormat.format(new Date(value)) : "—";
}
export function formatDate(value: string | null): string {
  return value && /^\d{4}-\d{2}-\d{2}/.test(value) ? calendar.format(new Date(`${value.slice(0, 10)}T00:00:00Z`)) : "—";
}
/** Today in Bangkok as YYYY-MM-DD, for calendar comparisons. */
export function todayInBangkok(): string {
  return isoDay.format(new Date());
}

/** Shared profile surface with a consistent heading and content spacing. */
export function ProfileSection({ title, meta, action, children, headingHidden = false }: { title: string; meta?: ReactNode; action?: ReactNode; children: ReactNode; headingHidden?: boolean }) {
  return (
    <Card role="region" aria-label={title} className="@container/profile-section min-w-0 p-4 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none">
      <div className={headingHidden ? "sr-only" : "mb-3 flex flex-wrap items-center justify-between gap-2"}>
        <h2 className="flex items-baseline gap-2 text-sm font-semibold text-foreground">
          {title}
          {meta && <span className="text-xs font-normal tabular-nums text-muted-foreground">{meta}</span>}
        </h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

export interface ProfileRow { label: string; value: ReactNode; wide?: boolean }

/** Label/value rows; the header summary omits the Overview's row rules. */
export function ProfileRows({ rows, separators = true }: { rows: ProfileRow[]; separators?: boolean }) {
  return (
    <dl className={`min-w-0 ${separators ? "divide-y divide-border" : ""}`}>
      {rows.map((row) => (
        <div key={row.label} className="grid min-w-0 gap-1 py-2 @min-xs/profile-section:grid-cols-[minmax(0,7rem)_minmax(0,1fr)] @min-xs/profile-section:items-baseline @min-xs/profile-section:gap-3">
          <dt className="text-xs text-muted-foreground">{row.label}</dt>
          <dd className="min-w-0 whitespace-pre-wrap wrap-anywhere text-xs leading-relaxed text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** One of the header's key facts (05 §4.2: where it is, who is responsible). */
export function Fact({ icon: FactIcon, label, value, detail }: { icon: Icon; label: string; value: ReactNode; detail?: ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] items-start gap-2">
      <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-control bg-muted text-primary">
        <FactIcon className="size-5" />
      </span>
      <dt className="min-w-0 pt-1 text-xs leading-relaxed text-muted-foreground">{label}</dt>
      <dd className="min-w-0 space-y-1 pt-1 text-xs leading-relaxed wrap-anywhere text-foreground">
        {value}
        {detail && <span className="block text-xs wrap-anywhere text-muted-foreground">{detail}</span>}
      </dd>
    </div>
  );
}

export function SectionLoading({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="space-y-2 motion-reduce:[&_*]:animate-none">
      {Array.from({ length: rows }, (_, index) => <Skeleton key={index} className="h-4 w-full" />)}
    </div>
  );
}

export function SectionMessage({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "error" }) {
  return <p role={tone === "error" ? "alert" : undefined} className={`text-xs ${tone === "error" ? "text-error" : "text-muted-foreground"}`}>{children}</p>;
}

/** Canonical values get the shared badges; legacy values stay visible as text. */
export function StatusValue({ status }: { status: string }) {
  return ASSET_STATUSES.includes(status as AssetStatus) ? <StatusBadge status={status as AssetStatus} />
    : <span className="text-xs text-muted-foreground">{status || "—"}</span>;
}
export function ConditionValue({ condition }: { condition: string | null }) {
  return !condition || ASSET_CONDITIONS.includes(condition as AssetCondition) ? <ConditionBadge condition={condition as AssetCondition | null} />
    : <span className="text-xs text-muted-foreground">{condition}</span>;
}
