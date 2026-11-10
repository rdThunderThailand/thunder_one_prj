import type { ReactNode } from "react";
import { categoryDisplay } from "../../domain/asset-profile-display.mts";
import { locationTrail } from "../../domain/asset-profile";
import type { AssetDetail, AssetFiles } from "../../services/asset-profile-contract";
import { AssetThumbnail } from "../AssetThumbnail";
import { ConditionValue, formatDate, formatDay, ProfileRows, ProfileSection, StatusValue } from "./ProfileParts";
import { CustodianValue, WarrantyValue } from "./ProfileValues";

export function ProfileHero({ asset, photos, onPhotoFailed, actions }: {
  asset: AssetDetail; photos: AssetFiles["photos"]; onPhotoFailed: () => void; actions: ReactNode;
}) {
  const category = categoryDisplay(asset.categoryPath);
  const photo = photos[0];
  return (
    <header className="@container/profile-hero min-w-0">
      <div className="grid min-w-0 items-start gap-3 @min-2xl/profile-hero:grid-cols-[9rem_minmax(0,1fr)] @min-3xl/profile-hero:grid-cols-[12rem_minmax(0,1fr)]">
        <AssetThumbnail
          src={photo?.url ?? photo?.thumbnailUrl ?? null}
          alt={photo ? `Photo of ${asset.name}` : ""}
          className="h-48 w-44 object-contain! p-1 @min-2xl/profile-hero:h-56 @min-2xl/profile-hero:w-full"
          iconClassName="size-10"
          onFailed={onPhotoFailed}
        />
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1 basis-64 space-y-1">
              <div className="flex items-start gap-2">
                <h1 className="min-w-0 text-xl font-extrabold tracking-tight wrap-anywhere">{asset.name || "Unnamed asset"}</h1>
                <span className="shrink-0 pt-1">
                  <StatusValue status={asset.lifecycleStatus} />
                </span>
              </div>
              <p className="text-xs leading-relaxed wrap-anywhere text-muted-foreground">
                {[asset.assetTag, category.category, category.subcategory].filter(Boolean).join(" | ")}
              </p>
            </div>
            {actions}
          </div>
          <ProfileSection title="Asset summary" headingHidden>
            <div className="grid min-w-0 gap-x-6 @min-lg/profile-section:grid-cols-2">
              <ProfileRows separators={false} rows={[
                { label: "Category", value: category.category },
                { label: "Serial Number", value: asset.serialNumber || "—" },
                { label: "Asset Tag", value: asset.assetTag },
                { label: "Purchase Date", value: formatDate(asset.acquisitionDate) },
                { label: "Status", value: <StatusValue status={asset.lifecycleStatus} /> },
              ]} />
              <ProfileRows separators={false} rows={[
                { label: "Current Custodian", value: <CustodianValue custody={asset.custody} /> },
                { label: "Assigned Date", value: asset.custody ? formatDay(asset.custody.since) : "—" },
                { label: "Location", value: locationTrail(asset.locationPath, asset.location) || "—" },
                { label: "Warranty", value: <WarrantyValue warranty={asset.currentWarranty} /> },
                { label: "Condition", value: <ConditionValue condition={asset.condition} /> },
              ]} />
            </div>
          </ProfileSection>
        </div>
      </div>
    </header>
  );
}

