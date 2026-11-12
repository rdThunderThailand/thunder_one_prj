import { getSession } from "@/features/auth/services/get-session";
import { AccessDeniedState, NotFoundState } from "../states/states";
import { AssignFlowView } from "./AssignFlowView";
import { TransferFlowView } from "./TransferFlowView";
import { ReturnFlowView } from "./ReturnFlowView";
import { ChangeStatusActionView } from "../lifecycle/ChangeStatusActionView";
import { RetireFlowView } from "../lifecycle/RetireFlowView";

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VIEWS = {
  assign: AssignFlowView, transfer: TransferFlowView, return: ReturnFlowView, "change-status": ChangeStatusActionView, retire: RetireFlowView,
};

/** Server entry shared by `/assets/{id}/{action}` (profile) and `/assignments/{id}/{action}` (Assignments list). */
export async function ActionRoute({ params, action, from }: {
  params: Promise<{ assetId: string }>; action: keyof typeof VIEWS; from?: "assignments";
}) {
  const [{ assetId }, session] = await Promise.all([params, getSession()]);
  if (session === "forbidden" || !session.tenantId || !session.userId) return <AccessDeniedState />;
  if (!GUID.test(assetId)) return <NotFoundState title="Asset not found" />;
  const context = `${session.tenantId}:${session.userId}`;
  const View = VIEWS[action];
  return (
    <View
      key={`${context}:${assetId}`}
      context={context}
      assetId={assetId.toLowerCase()}
      from={from}
    />
  );
}
