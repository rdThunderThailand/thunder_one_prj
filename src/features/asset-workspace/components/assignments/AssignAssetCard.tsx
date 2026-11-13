import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { ClipboardIcon, FileTextIcon } from "@/components/ui/icons";
import type { AssetCondition } from "../../domain/asset-condition";
import type { AssetStatus } from "../../domain/asset-status";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { AssetThumbnail } from "../AssetThumbnail";
import { ConditionBadge, StatusBadge } from "../StatusBadges";
import { AssignHolder } from "./AssignHolder";
import { ReviewSection, SectionTitle } from "./SectionTitle";

type Column = "serial" | "tag" | "custodian" | "status" | "condition";

function column(asset: AssetDetail, key: Column): { label: string; value: ReactNode } {
  switch (key) {
    case "serial": return { label: "Serial Number", value: asset.serialNumber || "—" };
    case "tag": return { label: "Asset Tag", value: asset.assetTag };
    case "status": return { label: "Current Status", value: <StatusBadge status={asset.lifecycleStatus as AssetStatus} /> };
    case "condition": return { label: "Condition", value: <ConditionBadge condition={asset.condition as AssetCondition | null} /> };
    case "custodian": return {
      label: "Current Custodian",
      value: asset.custody ? (
        <AssignHolder
          type={asset.custody.type}
          name={asset.custody.name}
          secondary={asset.custody.department?.name}
          avatarUrl={asset.custody.avatarUrl}
        />
      ) : "None",
    };
  }
}

/**
 * PO frames 16 / 20–22 asset block: photo, name + status, then label-over-value columns. The DB has one identifier
 * (asset tag, no separate asset ID), so the subtitle shows the category path and the tag sits in its own column.
 */
export function AssignAssetCard({ asset, thumbnailUrl, columns = ["serial", "tag", "custodian"], reviewTitle }: {
  asset: AssetDetail; thumbnailUrl: string | null; columns?: Column[]; reviewTitle?: string;
}) {
  const path = asset.categoryPath.map((item) => item.name).filter(Boolean);
  const name = (
    <div className="min-w-40 flex-1 space-y-1">
      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground wrap-anywhere">
        {asset.name}
        <StatusBadge status={asset.lifecycleStatus as AssetStatus} />
      </p>
      <p className="text-2xs text-muted-foreground wrap-anywhere">
        {(path.length ? path : [asset.category?.name]).filter(Boolean).join(" | ") || "—"}
      </p>
    </div>
  );
  const fields = (
    <dl className="flex min-w-0 flex-wrap gap-y-2 text-2xs">
      {columns.map((key) => {
        const item = column(asset, key);
        return (
          <div
            key={key}
            className="min-w-0 space-y-1 border-l border-border px-4 first:border-l-0 first:pl-0"
          >
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="text-xs text-foreground wrap-anywhere">{item.value}</dd>
          </div>
        );
      })}
    </dl>
  );
  // Details (frames 16 / 21): columns beside the name. Review (frames 20 / 22): columns under the name, beside the photo.
  const body = (
    <div className={`flex min-w-0 gap-4 ${reviewTitle ? "items-start" : "flex-wrap items-center"}`}>
      <AssetThumbnail
        src={thumbnailUrl}
        className="size-16 shrink-0"
        iconClassName="size-7"
      />
      {reviewTitle ? (
        <div className="min-w-0 flex-1 space-y-3">
          {name}
          {fields}
        </div>
      ) : (
        <>
          {name}
          {fields}
        </>
      )}
    </div>
  );
  if (reviewTitle) {
    return (
      <ReviewSection
        icon={FileTextIcon}
        title={reviewTitle}
      >
        {body}
      </ReviewSection>
    );
  }
  return (
    <Card className="space-y-3 p-4">
      <SectionTitle icon={ClipboardIcon}>Asset Information</SectionTitle>
      {body}
    </Card>
  );
}
