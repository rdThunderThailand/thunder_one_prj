// My Assets › asset view (EMP-02, UC-002). Read only: the `/me` allow-list, no admin actions (persona map §2,
// AC-032, AC-034).
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { ConditionValue, ProfileRows, ProfileSection, StatusValue, formatDate, formatDateTime } from "../../components/asset-profile/ProfileParts";
import { CustodianValue, WarrantyValue } from "../../components/asset-profile/ProfileValues";
import type { MyAsset } from "./my-assets-api";

const path = (items: { name: string | null }[], fallback: { name: string | null } | null) =>
  (items.length ? items.map((item) => item.name || "Unnamed").join(" › ") : fallback?.name) || "—";

export function MyAssetView({ asset, backHref }: { asset: MyAsset; backHref: string }) {
  const warranty = asset.currentWarranty;
  return (
    <div className="space-y-4 p-4 sm:p-6">
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
      <PageHeader
        title={asset.name}
        subtitle={asset.assetTag}
      />
      <div className="flex flex-wrap items-center gap-2">
        <StatusValue status={asset.lifecycleStatus} />
        <ConditionValue condition={asset.condition} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ProfileSection title="Profile">
          <ProfileRows
            rows={[
              { label: "Serial Number", value: asset.serialNumber || "—" },
              { label: "Category", value: path(asset.categoryPath, asset.category) },
              { label: "Description", value: asset.description || "—" },
              { label: "Acquired", value: formatDate(asset.acquisitionDate) },
              { label: "Last Updated", value: formatDateTime(asset.updatedAt) },
            ]}
          />
        </ProfileSection>
        <div className="space-y-4">
          <ProfileSection title="Location">
            <ProfileRows rows={[{ label: "Location", value: path(asset.locationPath, asset.location) }]} />
          </ProfileSection>
          <ProfileSection title="Custody">
            <ProfileRows
              rows={[
                { label: "Held by", value: <CustodianValue custody={asset.custody && { ...asset.custody, note: null }} /> },
                { label: "Since", value: formatDateTime(asset.custody?.since ?? null) },
              ]}
            />
          </ProfileSection>
          <ProfileSection title="Warranty">
            <ProfileRows
              rows={[
                { label: "Status", value: <WarrantyValue warranty={warranty && { ...warranty, id: "", referenceNo: null, coverageNote: null, status: null }} /> },
                { label: "Type", value: warranty?.type || "—" },
                { label: "Start", value: formatDate(warranty?.startDate ?? null) },
              ]}
            />
          </ProfileSection>
        </div>
      </div>
    </div>
  );
}
