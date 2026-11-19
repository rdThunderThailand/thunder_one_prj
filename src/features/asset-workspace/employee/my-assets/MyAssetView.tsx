// My Assets › asset view (EMP-02, UC-002). Read only: the `/me` allow-list, no admin actions (persona map §2,
// AC-032, AC-034). Look follows the admin asset profile (hero, facts, rail) with shared profile parts.
import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ArrowLeftIcon, CalendarIcon, CategoryIcon, ClockIcon, InfoIcon, LocationIcon, TagIcon } from "@/components/ui/icons";
import { AssetThumbnail } from "../../components/AssetThumbnail";
import {
  ConditionValue,
  Fact,
  ProfileRows,
  ProfileSection,
  StatusValue,
  formatDate,
  formatDateTime,
  formatDay,
  todayInBangkok,
} from "../../components/asset-profile/ProfileParts";
import { WarrantyValue } from "../../components/asset-profile/ProfileValues";
import type { MyAsset } from "./my-assets-api";
import { warrantyLeft } from "./my-assets-query";

const path = (items: { name: string | null }[], fallback: { name: string | null } | null) =>
  (items.length ? items.map((item) => item.name || "Unnamed").join(" › ") : fallback?.name) || "—";

function SummaryFact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm font-semibold wrap-anywhere text-foreground">{children}</dd>
    </div>
  );
}

function Hero({ asset, photo }: { asset: MyAsset; photo: string | null }) {
  const category = asset.categoryPath.at(-1)?.name ?? asset.category?.name;
  return (
    <Card className="@container/my-asset-hero min-w-0 p-4 sm:p-5">
      <div className="grid min-w-0 items-start gap-4 @min-xl/my-asset-hero:grid-cols-[10rem_minmax(0,1fr)]">
        <AssetThumbnail
          src={photo}
          alt={photo ? `Photo of ${asset.name}` : ""}
          className="h-40 w-full object-contain! p-1 @min-xl/my-asset-hero:w-40"
          iconClassName="size-10"
        />
        <div className="min-w-0 space-y-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="min-w-0 text-xl font-extrabold tracking-tight wrap-anywhere text-foreground">{asset.name}</h1>
              <StatusValue status={asset.lifecycleStatus} />
            </div>
            <p className="text-xs wrap-anywhere text-muted-foreground">
              {[asset.assetTag, category].filter(Boolean).join(" | ")}
            </p>
          </div>
          <dl className="grid min-w-0 grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-4 @min-2xl/my-asset-hero:grid-cols-4">
            <SummaryFact label="Asset Tag">{asset.assetTag}</SummaryFact>
            <SummaryFact label="Serial Number">{asset.serialNumber || "—"}</SummaryFact>
            <SummaryFact label="Condition">
              <ConditionValue condition={asset.condition} />
            </SummaryFact>
            <SummaryFact label="Acquired">{formatDate(asset.acquisitionDate)}</SummaryFact>
          </dl>
        </div>
      </div>
    </Card>
  );
}

function HeldBy({ custody }: { custody: MyAsset["custody"] }) {
  const name = custody?.name || "You";
  return (
    <Card
      role="region"
      aria-label="Held by"
      className="min-w-0 space-y-3 bg-accent/50! p-4"
    >
      <h2 className="text-sm font-semibold text-foreground">Held by</h2>
      <div className="flex min-w-0 items-center gap-3">
        <Avatar
          name={name}
          src={custody?.avatarUrl ?? null}
          size={40}
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold wrap-anywhere text-foreground">{name}</p>
          {custody?.department && <p className="text-xs wrap-anywhere text-muted-foreground">{custody.department.name}</p>}
        </div>
      </div>
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ClockIcon
          aria-hidden="true"
          className="size-4 text-primary"
        />
        Assigned to you since {formatDay(custody?.since ?? null)}
      </p>
    </Card>
  );
}

function Warranty({ warranty }: { warranty: MyAsset["currentWarranty"] }) {
  const time = warranty && warrantyLeft(warranty.startDate, warranty.endDate, todayInBangkok());
  const tone = warranty?.expiryStatus === "Expired" ? "red" : warranty?.expiryStatus === "Expiring Soon" ? "amber" : "emerald";
  return (
    <ProfileSection title="Warranty">
      <div className="space-y-3">
        <WarrantyValue warranty={warranty && { ...warranty, id: "", referenceNo: null, coverageNote: null, status: null }} />
        {time && (
          <div className="space-y-1.5">
            <p className={`text-xs font-medium ${time.left < 0 ? "text-error" : "text-foreground"}`}>{time.text}</p>
            {time.usedPct !== null && (
              <ProgressBar
                value={time.usedPct}
                color={tone}
                aria-label="Warranty period used"
              />
            )}
          </div>
        )}
        {warranty && (
          <ProfileRows
            rows={[
              { label: "Type", value: warranty.type || "—" },
              { label: "Start", value: formatDate(warranty.startDate) },
              { label: "End", value: formatDate(warranty.endDate) },
            ]}
          />
        )}
      </div>
    </ProfileSection>
  );
}

export function MyAssetView({ asset, photo, backHref }: { asset: MyAsset; photo: string | null; backHref: string }) {
  return (
    <div className="@container/my-asset space-y-4">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ArrowLeftIcon
          aria-hidden="true"
          className="h-4 w-4"
        />
        My Assets
      </Link>
      <div className="grid min-w-0 items-start gap-4 @min-5xl/my-asset:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-4">
          <Hero
            asset={asset}
            photo={photo}
          />
          <ProfileSection title="Details">
            <dl className="space-y-3">
              <Fact
                icon={CategoryIcon}
                label="Category"
                value={path(asset.categoryPath, asset.category)}
              />
              <Fact
                icon={LocationIcon}
                label="Location"
                value={path(asset.locationPath, asset.location)}
              />
              <Fact
                icon={TagIcon}
                label="Description"
                value={asset.description || "—"}
              />
              <Fact
                icon={CalendarIcon}
                label="Last Updated"
                value={formatDateTime(asset.updatedAt)}
              />
            </dl>
          </ProfileSection>
        </div>
        <aside
          aria-label="Custody and warranty"
          className="grid min-w-0 gap-4 @min-2xl/my-asset:grid-cols-2 @min-5xl/my-asset:grid-cols-1"
        >
          <HeldBy custody={asset.custody} />
          <Warranty warranty={asset.currentWarranty} />
          <Card className="flex gap-3 p-4">
            <InfoIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-info"
            />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Something wrong with this asset?</p>
              <p className="text-xs text-muted-foreground">
                Details are managed by your asset admin. Ask them to update the location, condition or custody.
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
