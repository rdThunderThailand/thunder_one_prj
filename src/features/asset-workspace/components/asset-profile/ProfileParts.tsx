import type { ReactNode } from "react";
import type { Icon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/Skeleton";
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
export function ProfileSection({ title, meta, action, children }: { title: string; meta?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={title} className="@container/profile-section min-w-0 rounded-card border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-baseline gap-2 text-sm font-semibold text-foreground">
          {title}
          {meta && <span className="text-xs font-normal tabular-nums text-muted-foreground">{meta}</span>}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export interface ProfileRow { label: string; value: ReactNode; wide?: boolean }

/** Ruled label/value rows; long text spans both columns on wide cards. */
export function ProfileRows({ rows }: { rows: ProfileRow[] }) {
  return (
    <dl className="grid border-t border-border @min-3xl/profile-section:grid-cols-2 @min-3xl/profile-section:gap-x-6">
      {rows.map((row) => (
        <div key={row.label} className={`grid min-w-0 gap-1 border-b border-border py-3 @min-xs/profile-section:grid-cols-[minmax(0,7rem)_minmax(0,1fr)] @min-xs/profile-section:items-baseline @min-xs/profile-section:gap-3 ${row.wide ? "@min-3xl/profile-section:col-span-2" : ""}`}>
          <dt className="text-xs font-medium text-foreground">{row.label}</dt>
          <dd className="min-w-0 whitespace-pre-wrap wrap-anywhere text-xs leading-relaxed text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** One of the header's key facts (05 §4.2: where it is, who is responsible). */
export function Fact({ icon: FactIcon, label, value, detail }: { icon: Icon; label: string; value: ReactNode; detail?: ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
        <FactIcon className="size-5" />
      </span>
      <div className="min-w-0 space-y-0.5">
        <dt className="text-xs font-medium text-foreground">{label}</dt>
        <dd className="text-xs font-semibold leading-relaxed wrap-anywhere text-foreground">{value}</dd>
        {detail && <dd className="text-xs wrap-anywhere text-muted-foreground">{detail}</dd>}
      </div>
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
