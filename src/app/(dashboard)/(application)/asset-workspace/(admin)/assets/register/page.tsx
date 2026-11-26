import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { RegisterAssetPage } from "@/features/asset-workspace/components/register-asset/RegisterAssetPage";
import { startRegistrationFirstData } from "@/features/asset-workspace/services/registration-first-data";
import { AccessDeniedState } from "@/features/asset-workspace/components/states/states";

export default async function Page({ searchParams }: { searchParams: Promise<{ mode?: string | string[]; category_id?: string | string[]; location_id?: string | string[] }> }) {
  const [params, session, token] = await Promise.all([searchParams, getSession(), getAuthToken()]);
  if (session === "forbidden" || !session.tenantId || !session.userId) return <AccessDeniedState />;
  const single = params.mode === "single";
  const firstData = single && token
    ? await startRegistrationFirstData(token, session.tenantId, session.userId, params.category_id) : undefined;
  return <RegisterAssetPage single={single} tenantId={session.tenantId} userId={session.userId}
    initialCategoryId={single ? params.category_id : undefined}
    initialLocationId={single ? params.location_id : undefined}
    firstData={firstData} />;
}
