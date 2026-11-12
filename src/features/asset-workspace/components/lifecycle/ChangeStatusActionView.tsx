import { getSession } from "@/features/auth/services/get-session";
import { AccessDeniedState } from "../states/states";
import { ChangeStatusFlowView } from "./ChangeStatusFlowView";

export async function ChangeStatusActionView({ context, assetId, from }: { context: string; assetId: string; from?: string }) {
  const session = await getSession();
  if (session === "forbidden") return <AccessDeniedState />;
  return <ChangeStatusFlowView context={context} assetId={assetId} from={from} actor={session.userName} />;
}
