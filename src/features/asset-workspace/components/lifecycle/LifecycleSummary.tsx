import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/lovable/button";
import { ClipboardIcon, ClockIcon, InfoIcon, LocationIcon } from "@/components/ui/icons";
import { ASSET_CONDITIONS, type AssetCondition } from "../../domain/asset-condition";
import { ASSET_STATUSES, type AssetStatus } from "../../domain/asset-status";
import { endsCustody } from "../../domain/asset-lifecycle-actions";
import { locationTrail } from "../../domain/asset-profile";
import { assignmentDate } from "../../domain/assignment-current";
import type { ChangeStatusFlow } from "../../hooks/use-change-status-flow";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { AssetThumbnail } from "../AssetThumbnail";
import { ConditionBadge, StatusBadge } from "../StatusBadges";
import { AssignHolder } from "../assignments/AssignHolder";

export function LifecycleStatus({ value }: { value: string }) {
  return ASSET_STATUSES.some((status) => status === value) ? <StatusBadge status={value as AssetStatus} /> : <span>{value || "—"}</span>;
}

export function LifecycleCondition({ value }: { value: string | null }) {
  return ASSET_CONDITIONS.some((condition) => condition === value)
    ? <ConditionBadge condition={value as AssetCondition} /> : <span>{value || "—"}</span>;
}

export function LifecycleHolder({ holder, empty = "—" }: { holder: AssetDetail["custody"]; empty?: string }) {
  if (!holder) return <span>{empty}</span>;
  return (
    <AssignHolder
      type={holder.type}
      name={holder.name}
      secondary={holder.department?.name}
      avatarUrl={holder.avatarUrl}
    />
  );
}

export function LifecycleValues({ rows }: { rows: ReadonlyArray<readonly [string, ReactNode]> }) {
  return (
    <dl className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start gap-x-3 gap-y-2.5 text-xs">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="min-w-0 font-medium text-foreground wrap-anywhere">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function LifecycleIdentity({ asset, photo, review = false }: { asset: AssetDetail; photo: string | null; review?: boolean }) {
  const category = asset.categoryPath.map(({ name }) => name).filter(Boolean).join(" | ") || asset.category?.name;
  return (
    <div className="flex min-w-0 items-center gap-3">
      <AssetThumbnail src={photo} className="size-16 shrink-0" />
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-foreground wrap-anywhere">{asset.name}</p>
          {review && <LifecycleStatus value={asset.lifecycleStatus} />}
        </div>
        <p className="text-xs text-muted-foreground wrap-anywhere">{asset.assetTag}</p>
        {category && <p className="text-xs text-muted-foreground wrap-anywhere">{category}</p>}
      </div>
    </div>
  );
}

export function LifecycleNotice({ title, lines, kind = "info", numbered = false }: {
  title: string; lines: string[]; kind?: "info" | "notes"; numbered?: boolean;
}) {
  const List = numbered ? "ol" : "ul";
  return (
    <section className={`space-y-2 rounded-card border p-3.5 ${kind === "info" ? "border-primary/15 bg-accent/60" : "border-border bg-muted/50"}`}>
      <h3 className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <InfoIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
        {title}
      </h3>
      <List className={`${numbered ? "list-decimal" : "list-disc"} space-y-1.5 pl-5 text-xs ${kind === "info" ? "text-foreground/90 marker:text-accent-foreground" : "text-muted-foreground marker:text-muted-foreground"}`}>
        {lines.map((line) => <li key={line}>{line}</li>)}
      </List>
    </section>
  );
}

type ProfileFiles = { result: { ok: boolean } | null; pending: boolean; reload: () => void };

/** Side-panel "Asset Summary" card shared by Change Status, Retire and Dispose (frames 25–33). */
export function LifecycleAssetCard({ asset, photo, files, statusRows }: {
  asset: AssetDetail; photo: string | null; files: ProfileFiles; statusRows?: ReadonlyArray<readonly [string, ReactNode]>;
}) {
  return (
    <Card className="space-y-3 p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <ClipboardIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
        Asset Summary
      </h2>
      <LifecycleIdentity asset={asset} photo={photo} />
      {files.result && !files.result.ok && (
        <Button type="button" variant="outline" size="sm" disabled={files.pending} onClick={files.reload}>
          Retry asset photo
        </Button>
      )}
      <div className="border-t border-border pt-3">
        <LifecycleValues rows={[
          ["Serial Number", asset.serialNumber || "—"],
          ["Asset Tag", asset.assetTag],
          ["Category", asset.category?.name || "—"],
          ["Brand / Model", "—"],
          ["Purchase Date", asset.acquisitionDate ? assignmentDate(asset.acquisitionDate) : "—"],
          ...(statusRows ?? [
            ["Current Status", <LifecycleStatus key="status" value={asset.lifecycleStatus} />],
            ["Current Condition", <LifecycleCondition key="condition" value={asset.condition} />],
          ]),
        ]} />
      </div>
      <section className="space-y-2 border-t border-border pt-3 text-xs">
        <h3 className="font-semibold text-foreground">{asset.custody ? "Current Custodian" : "Last Custodian"}</h3>
        <LifecycleHolder holder={asset.custody} />
        <p className="flex items-center gap-1.5 text-muted-foreground wrap-anywhere">
          <LocationIcon aria-hidden="true" className="size-3.5 shrink-0" />
          {locationTrail(asset.locationPath, asset.location) || "—"}
        </p>
        {asset.custody?.since && (
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <ClockIcon aria-hidden="true" className="size-3.5 shrink-0" />
            Since {assignmentDate(asset.custody.since)}
          </p>
        )}
      </section>
    </Card>
  );
}

export function LifecycleSummary({ asset, flow }: { asset: AssetDetail; flow: ChangeStatusFlow }) {
  const { draft, saved } = flow;
  const before = saved?.before ?? asset;
  const nextStatus = saved?.after.lifecycleStatus ?? draft.status;
  const nextCondition = saved?.after.condition ?? draft.condition;
  const custodyEnds = saved ? Boolean(before.custody && !asset.custody) : endsCustody(before, nextStatus);
  const holder = before.custody?.name ?? "the current custodian";
  const outcomes = [
    nextStatus && before.lifecycleStatus !== nextStatus && (saved
      ? `The asset status is now ${nextStatus}.` : `Asset status will change from ${before.lifecycleStatus} → ${nextStatus}.`),
    nextCondition && before.condition !== nextCondition && (saved
      ? `The asset condition is now ${nextCondition}.` : `Asset condition will change from ${before.condition ?? "—"} → ${nextCondition}.`),
    saved ? "This change is recorded in Status History and Audit Log." : "A record will be created in Status History and Audit Log.",
    custodyEnds && (saved ? `Custody of ${holder} has ended.` : `The current custody (${holder}) will end.`),
    !custodyEnds && before.custody && (saved
      ? `The current custodian remains the same (${holder}).`
      : before.lifecycleStatus !== nextStatus && nextStatus === "In Maintenance"
        && "The current custodian will remain assigned during maintenance (unless you return first)."),
    saved && "You can view full asset details or status history from the actions below.",
  ].filter((line): line is string => typeof line === "string" && Boolean(line));
  const notes = [
    "If you need to change custodian, use Return or Transfer instead.",
    ...(asset.lifecycleStatus === "Assigned" ? ["To set status to Available, you must return the asset first."] : []),
    "Retire / Dispose are only available for eligible statuses.",
    ...(flow.step === 1 ? ["This action will be recorded in Audit Log."] : []),
  ];

  return (
    <aside aria-label="Asset Summary" className="min-w-0 space-y-3">
      <LifecycleAssetCard asset={asset} photo={flow.photo} files={flow.files} />
      <LifecycleNotice
        title={saved ? "What happens next?" : flow.step === 1 ? "What will happen after confirmation?" : "What will Happen next?"}
        lines={outcomes}
      />
      {!saved && <LifecycleNotice title="Important Notes" lines={notes} kind="notes" />}
    </aside>
  );
}
