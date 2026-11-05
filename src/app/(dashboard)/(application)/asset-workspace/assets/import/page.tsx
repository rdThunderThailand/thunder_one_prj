import { Suspense } from "react";
import { getSession } from "@/features/auth/services/get-session";
import { BulkImportPage } from "@/features/asset-workspace/components/bulk-import/BulkImportPage";
import {
  AccessDeniedState,
  LoadingState,
} from "@/features/asset-workspace/components/states/states";

export default async function Page() {
  const session = await getSession();
  if (session === "forbidden" || !session.tenantId || !session.userId) {
    return <AccessDeniedState />;
  }
  return (
    <Suspense fallback={<LoadingState />}>
      <BulkImportPage tenantId={session.tenantId} userId={session.userId} />
    </Suspense>
  );
}
