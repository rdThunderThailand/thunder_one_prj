import { Suspense } from "react";
import { LifecycleTabView } from "@/features/asset-workspace/components/lifecycle-warranty/LifecycleTabView";
import { LwLoading } from "@/features/asset-workspace/components/lifecycle-warranty/LwLoading";
import { WarrantyTabView } from "@/features/asset-workspace/components/lifecycle-warranty/WarrantyTabView";
import { readLwTab } from "@/features/asset-workspace/domain/lifecycle-list";
import type { SearchParams } from "@/features/asset-workspace/services/asset-reports-api";
import { getLifecycleTab, getWarrantyTab } from "@/features/asset-workspace/services/warranty-workspace-api";

async function LifecycleContent({ sp }: { sp: SearchParams }) {
  return <LifecycleTabView data={await getLifecycleTab(sp)} />;
}

async function WarrantyContent({ sp }: { sp: SearchParams }) {
  return <WarrantyTabView data={await getWarrantyTab(sp)} />;
}

// UC-008, UC-009 · PO 05 §4.4, §4.13.5. Reads are server-side; `?tab=lifecycle|warranty` (FE 01).
export default async function LifecycleWarrantyPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const tab = readLwTab(sp.tab);
  return (
    <Suspense key={tab} fallback={<LwLoading tab={tab} />}>
      {tab === "warranty" ? <WarrantyContent sp={sp} /> : <LifecycleContent sp={sp} />}
    </Suspense>
  );
}
