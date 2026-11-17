"use client";

// My Assets list (EMP-02, UC-002, AC-004). The server page fetches from the URL; this declares the columns and renders
// the employee list scaffold. Read only: no selection, no row actions (employee README M4); a row opens the asset.
import Link from "next/link";
import { AssetThumbnail } from "../../components/AssetThumbnail";
import { ConditionValue, StatusValue, formatDateTime } from "../../components/asset-profile/ProfileParts";
import type { ListColumn, ListData } from "../../components/list-page/AssetWorkspaceListPage";
import { ReportFilterBar } from "../../components/reports/ReportFilterBar";
import { ASSET_CONDITIONS } from "../../domain/asset-condition";
import type { AssetListRow } from "../../services/assets-list-types";
import { EmployeeListPage, type ListTab } from "../shared/EmployeeListPage";
import { MY_ASSET_TABS, type FilterChoice } from "./my-assets-query";

// Below md only the asset and its status show, so 375px has no horizontal scroll.
const WIDE = "hidden md:table-cell";

const assetHref = (id: string, listSearch: string) =>
  `/asset-workspace/my-assets/${encodeURIComponent(id)}${listSearch ? `?from=${encodeURIComponent(listSearch)}` : ""}`;

function columns(listSearch: string): ListColumn<AssetListRow>[] {
  const href = (id: string) => assetHref(id, listSearch);
  return [
    {
      key: "asset",
      header: "Asset",
      render: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <AssetThumbnail src={row.thumbnail_url} />
          <div className="min-w-0">
            <Link
              href={href(row.id)}
              className="block font-medium text-primary wrap-anywhere hover:underline"
            >
              {row.name}
            </Link>
            <p className="text-xs whitespace-nowrap text-muted-foreground">{row.asset_code}</p>
          </div>
        </div>
      ),
    },
    { key: "category", header: "Category", render: (row) => row.category_name ?? "—", className: WIDE },
    { key: "location", header: "Location", render: (row) => row.location_name ?? "—", className: WIDE },
    { key: "status", header: "Status", render: (row) => <StatusValue status={row.status} /> },
    { key: "condition", header: "Condition", render: (row) => <ConditionValue condition={row.condition} />, className: WIDE },
    { key: "updated", header: "Last Updated", render: (row) => formatDateTime(row.updated_at), className: `${WIDE} whitespace-nowrap` },
  ];
}

export function MyAssetsView({
  data,
  counts,
  choices,
  filtered,
  listSearch,
  loading,
}: {
  data: ListData<AssetListRow> | null;
  /** Rows per tab with the same search and filters; `null` = that count failed. */
  counts: Record<string, number | null>;
  choices: { categories: FilterChoice[]; locations: FilterChoice[] } | null;
  /** A search, filter or tab is set: the empty state is "no match", not "no assets". */
  filtered: boolean;
  /** The list's query, carried to the asset view so Back returns here. */
  listSearch: string;
  loading?: boolean;
}) {
  return (
    <EmployeeListPage
      title="My Assets"
      subtitle="Assets you are responsible for."
      tabs={MY_ASSET_TABS.map((tab): ListTab => ({ ...tab, count: counts[tab.key] }))}
      filters={(url) => (
        <ReportFilterBar
          url={url}
          searchPlaceholder="Search tag, name or serial"
          selects={[
            { key: "category_id", label: "Category", options: choices?.categories ?? [] },
            { key: "location_id", label: "Location", options: choices?.locations ?? [] },
            { key: "condition", label: "Condition", options: ASSET_CONDITIONS.map((value) => ({ value, label: value })) },
          ]}
        />
      )}
      columns={columns(listSearch)}
      data={data}
      getRowId={(row) => row.id}
      rowHref={(row) => assetHref(row.id, listSearch)}
      rowLabel={(row) => row.name}
      itemLabel="assets"
      emptyTitle={filtered ? "No matching assets" : "No assets yet"}
      emptyBody={filtered ? "Try another search or clear the filters." : "Assets assigned to you will appear here."}
      loading={loading}
      thumbnails
    />
  );
}

/** Route loading screen: the same page with skeleton rows and counts. */
export function MyAssetsLoading() {
  return (
    <MyAssetsView
      data={null}
      counts={{}}
      choices={null}
      filtered={false}
      listSearch=""
      loading
    />
  );
}
