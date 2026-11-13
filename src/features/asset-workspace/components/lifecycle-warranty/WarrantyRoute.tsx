import { getSession } from "@/features/auth/services/get-session";
import { AccessDeniedState, NotFoundState } from "../states/states";
import { WarrantyFlowView } from "./WarrantyFlowView";

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Server entry for FE 04 (same checks as ActionRoute, kept apart so existing routes stay untouched). */
export async function WarrantyRoute({ params, searchParams }: {
  params?: Promise<{ assetId: string; warrantyId?: string }>; searchParams: Promise<{ from?: string | string[] }>;
}) {
  const [ids, sp, session] = await Promise.all([params, searchParams, getSession()]);
  if (session === "forbidden" || !session.tenantId || !session.userId) return <AccessDeniedState />;
  if (ids && (!GUID.test(ids.assetId) || (ids.warrantyId !== undefined && !GUID.test(ids.warrantyId)))) {
    return <NotFoundState title={ids.warrantyId !== undefined ? "Warranty not found" : "Asset not found"} />;
  }
  const context = `${session.tenantId}:${session.userId}`;
  const assetId = ids?.assetId.toLowerCase() ?? null;
  const warrantyId = ids?.warrantyId?.toLowerCase() ?? null;
  return (
    <WarrantyFlowView
      key={`${context}:${assetId}:${warrantyId}`}
      context={context}
      assetId={assetId}
      warrantyId={warrantyId}
      from={typeof sp.from === "string" ? sp.from : undefined}
    />
  );
}
