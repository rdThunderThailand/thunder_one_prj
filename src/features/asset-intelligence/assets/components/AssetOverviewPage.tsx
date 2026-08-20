"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/icons";
import { AddAssetForm } from "./AddAssetForm";
import { AssetOverviewDashboard } from "./AssetOverviewDashboard";
import { AssetsListPage } from "./AssetsListPage";

// Owns the "+ Add Asset" (AM-02) toggle so the button (in the header) and the
// form (below it) can share state — the whole overview page is a client
// component for this reason, not just the interactive pieces individually.
export function AssetOverviewPage() {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Asset Overview"
        subtitle="Manage asset risk and operations."
        actions={
          <Button variant="primary" onClick={() => setShowAddForm((v) => !v)}>
            <PlusIcon className="h-4 w-4" /> Add Asset
          </Button>
        }
      />
      {showAddForm && <AddAssetForm onClose={() => setShowAddForm(false)} />}
      <AssetOverviewDashboard />
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">All Assets</h2>
        <AssetsListPage />
      </div>
    </div>
  );
}
