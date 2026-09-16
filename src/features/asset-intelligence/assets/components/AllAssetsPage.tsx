"use client";

import { useState } from "react";
import { AddAssetForm } from "./AddAssetForm";
import { AllAssetsHeader } from "./AllAssetsHeader";
import { AssetRegistryFilterBar } from "./AssetRegistryFilterBar";
import { AssetRegistryStatTilesRow } from "./AssetRegistryStatTilesRow";
import { AssetRegistryTable } from "./AssetRegistryTable";
import { AssetRegistryTableControls } from "./AssetRegistryTableControls";
import type { AssetFilterOptions, AssetListPage, AssetSummary } from "../services/asset-list-api";

interface AllAssetsPageProps {
  list: AssetListPage | null;
  summary: AssetSummary | null;
  filters: AssetFilterOptions | null;
  filterQuery: Record<string, string | undefined>;
}

// Real Thunder_Core data as of 2026-08-26 (docs/asset-intelligence/asset-list-page-api-gap-analysis.md
// in Thunder_Core) — see this route's page.tsx for the fetch. `list`/`summary`/
// `filters` are `null` when their respective Core call failed; each section
// below renders its own fallback rather than crashing the whole page.
// Still owns the "+ Add Asset" (AM-02) toggle the way the old combined
// page did, since the list is what the form's result actually affects.
export function AllAssetsPage({ list, summary, filters, filterQuery }: AllAssetsPageProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <AllAssetsHeader onAddAsset={() => setShowAddForm((v) => !v)} />
      {showAddForm && <AddAssetForm onClose={() => setShowAddForm(false)} />}
      <AssetRegistryStatTilesRow summary={summary} />
      <AssetRegistryFilterBar filters={filters} />
      {list ? (
        <>
          <AssetRegistryTableControls
            page={list.page}
            pageSize={list.pageSize}
            total={list.total}
            totalPages={list.totalPages}
            filterQuery={filterQuery}
          />
          <AssetRegistryTable rows={list.rows} />
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-zinc-200 p-10 text-center text-sm text-zinc-400 dark:border-zinc-800">
          ไม่สามารถโหลดรายการทรัพย์สินได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง
        </p>
      )}
    </div>
  );
}
