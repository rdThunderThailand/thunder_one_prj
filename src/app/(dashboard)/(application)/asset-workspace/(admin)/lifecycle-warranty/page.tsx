import { Suspense } from "react";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { LifecycleSignedOut, LifecycleTabView } from "@/features/asset-workspace/components/lifecycle-warranty/LifecycleTabView";
import { LwLoading } from "@/features/asset-workspace/components/lifecycle-warranty/LwLoading";
import { WarrantyTabView } from "@/features/asset-workspace/components/lifecycle-warranty/WarrantyTabView";
import { readLwTab } from "@/features/asset-workspace/domain/lifecycle-list";
import type { SearchParams } from "@/features/asset-workspace/services/asset-reports-api";
import { startLifecycleTab } from "@/features/asset-workspace/services/lifecycle-first-data";
import { getWarrantyTab } from "@/features/asset-workspace/services/warranty-workspace-api";

async function LifecycleContent({ sp }: { sp: SearchParams }) {
  const [session, token] = await Promise.all([getSession(), getAuthToken()]);
  if (!token || session === "forbidden" || !session.tenantId || !session.userId) return <LifecycleSignedOut />;
  const context = `${session.tenantId}:${session.userId}`;
  return <LifecycleTabView key={context} context={context} seeds={await startLifecycleTab(token, session.tenantId, sp)} />;
}

async function WarrantyContent({ sp }: { sp: SearchParams }) {
  return <WarrantyTabView data={await getWarrantyTab(sp)} />;
}

// UC-008, UC-009 · PO 05 §4.4, §4.13.5. The server starts the reads; `?tab=lifecycle|warranty`.
export default async function LifecycleWarrantyPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const tab = readLwTab(sp.tab);
  return (
    <Suspense key={tab} fallback={<LwLoading tab={tab} />}>
      {tab === "warranty" ? <WarrantyContent sp={sp} /> : <LifecycleContent sp={sp} />}
    </Suspense>
  );
}
