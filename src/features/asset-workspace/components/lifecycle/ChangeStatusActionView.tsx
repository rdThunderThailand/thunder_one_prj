import { getSession } from "@/features/auth/services/get-session";
import type { ActionFirstData } from "../../services/asset-action-first-data";
import { AccessDeniedState } from "../states/states";
import { ChangeStatusFlowView } from "./ChangeStatusFlowView";

export async function ChangeStatusActionView({ context, assetId, from, firstData }: {
  context: string; assetId: string; from?: string; firstData?: ActionFirstData;
}) {
  const session = await getSession();
  if (session === "forbidden") return <AccessDeniedState />;
  return <ChangeStatusFlowView context={context} assetId={assetId} from={from} actor={session.userName} firstData={firstData} />;
}
