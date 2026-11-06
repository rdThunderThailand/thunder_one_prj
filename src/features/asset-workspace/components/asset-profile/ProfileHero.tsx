import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { CalendarIcon, EditIcon, LocationIcon, TagIcon, UserIcon, WarrantyIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Skeleton } from "@/components/ui/Skeleton";
import { locationTrail, warrantyState } from "../../domain/asset-profile";
import type { AssetDetail, AssetFiles } from "../../services/asset-profile-contract";
import { AssetThumbnail } from "../AssetThumbnail";
import { ConditionValue, Fact, formatDate, formatDay, SectionLoading, StatusValue, todayInBangkok } from "./ProfileParts";

export function ProfileHero({ asset, photos, onPhotoFailed, labelAction }: { asset: AssetDetail | null; photos: AssetFiles["photos"]; onPhotoFailed: () => void; labelAction: ReactNode }) {
  const photo = photos[0] ?? null;
  return (
    <header className="@container/profile-hero min-w-0 rounded-card border border-border bg-card p-4">
      <div className="flex flex-col gap-4 @min-xl/profile-hero:flex-row">
        <div className="relative w-fit shrink-0">
          <AssetThumbnail
            src={photo?.url ?? photo?.thumbnailUrl ?? null} alt={photo ? `Photo of ${asset?.name || "the asset"}` : ""}
            className="size-24 @min-5xl/profile-hero:size-32" iconClassName="size-10" onFailed={onPhotoFailed}
          />
          {photos.length > 1 && (
            <span className="absolute bottom-2 left-2 rounded-pill bg-card px-2 py-0.5 text-2xs font-medium tabular-nums text-foreground shadow-control">
              {photos.length} photos
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            {asset ? (
              <div className="min-w-0 flex-1 basis-64 space-y-2">
                <h1 className="text-xl font-extrabold tracking-tight wrap-anywhere text-foreground">{asset.name || "Unnamed asset"}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusValue status={asset.lifecycleStatus} />
                  <ConditionValue condition={asset.condition} />
                </div>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex min-w-0 max-w-full items-center gap-2 tabular-nums wrap-anywhere text-muted-foreground">
                    <TagIcon aria-hidden="true" className="size-4 shrink-0 text-primary" />
                    {asset.assetTag || "No Asset Tag"}
                  </span>
                  {/* Category is taxonomy: a neutral tag, never a status colour (DS-04). */}
                  <span className="max-w-full rounded-full border border-border bg-muted px-2 py-1 text-xs wrap-anywhere text-muted-foreground">{asset.category?.name || "Uncategorized"}</span>
                </p>
              </div>
            ) : (
              <div role="status" aria-label="Loading asset" className="w-72 max-w-full space-y-3 motion-reduce:[&_*]:animate-none">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-40" />
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {labelAction}
              <Button
                variant="outline" size="sm" aria-disabled="true" title="Editing is not available in this version"
                aria-description="Editing is not available in this version." className="cursor-not-allowed text-muted-foreground hover:bg-card max-sm:h-10"
              >
                <EditIcon aria-hidden="true" className="size-4" />
                Edit
              </Button>
            </div>
          </div>
          {asset ? <HeroFacts asset={asset} /> : <SectionLoading rows={2} />}
        </div>
      </div>
    </header>
  );
}

function HeroFacts({ asset }: { asset: AssetDetail }) {
  const trail = locationTrail(asset.locationPath, asset.location);
  const segments = trail ? trail.split(" › ") : [];
  const warranty = asset.currentWarranty;
  const coverage = warranty ? warrantyState(warranty.endDate, todayInBangkok()) : null;
  return (
    <dl className="grid gap-4 border-t border-border pt-3 @min-xl/profile-hero:grid-cols-2 @min-5xl/profile-hero:grid-cols-4">
      <Fact
        icon={LocationIcon} label="Location"
        value={segments.at(-1) ?? "No location"}
        detail={segments.length > 1 ? segments.slice(0, -1).join(" › ") : undefined}
      />
      <Fact
        icon={UserIcon} label="Custodian"
        value={asset.custody ? asset.custody.name || "Unnamed custodian" : "Unassigned"}
        detail={asset.custody
          ? `${asset.custody.type === "person" ? "Person" : "Organizational Unit"}${asset.custody.since ? ` · since ${formatDay(asset.custody.since)}` : ""}`
          : "No active custody"}
      />
      <Fact
        icon={WarrantyIcon} label="Warranty"
        value={warranty ? warranty.provider || "Unnamed provider" : "None recorded"}
        detail={warranty && coverage ? (
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant="pill" color={coverage.tone}>{coverage.label}</Badge>
            {warranty.endDate && <span className="tabular-nums">until {formatDate(warranty.endDate)}</span>}
          </span>
        ) : undefined}
      />
      <Fact
        icon={CalendarIcon} label="Registered"
        value={formatDay(asset.registrationDate)}
        detail={asset.acquisitionDate ? `Acquired ${formatDate(asset.acquisitionDate)}` : undefined}
      />
    </dl>
  );
}

