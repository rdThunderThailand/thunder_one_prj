import { Suspense } from "react";
import { headers } from "next/headers";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { BulkImportPage } from "@/features/asset-workspace/components/bulk-import/BulkImportPage";
import { startImportFirstData } from "@/features/asset-workspace/services/asset-import-first-data";
import {
  AccessDeniedState,
  LoadingState,
} from "@/features/asset-workspace/components/states/states";

export default async function Page({ searchParams }: { searchParams: Promise<{ batch?: string | string[] }> }) {
  const [params, session, token, requestHeaders] = await Promise.all([searchParams, getSession(), getAuthToken(), headers()]);
  if (session === "forbidden" || !session.tenantId || !session.userId) {
    return <AccessDeniedState />;
  }
  // A changed address inside an open import renders this page again; the import already has its data then.
  const opened = requestHeaders.get("sec-fetch-dest") !== "empty";
  const firstData = opened && token
    ? await startImportFirstData(token, session.tenantId, session.userId, params.batch) : undefined;
  return (
    <Suspense fallback={<LoadingState />}>
      <BulkImportPage tenantId={session.tenantId} userId={session.userId} firstData={firstData} />
    </Suspense>
  );
}
