import { getSession } from "@/features/auth/services/get-session";
import { ExportPageView } from "@/features/asset-workspace/components/lifecycle/ExportPageView";
import { AccessDeniedState } from "@/features/asset-workspace/components/states/states";

export default async function ExportPage() {
  const session = await getSession();
  if (session === "forbidden" || !session.tenantId || !session.userId) return <AccessDeniedState />;
  const context = `${session.tenantId}:${session.userId}`;
  return <ExportPageView key={context} context={context} />;
}
