import { getSession } from "@/features/auth/services/get-session";
import { RegisterAssetPage } from "@/features/asset-workspace/components/register-asset/RegisterAssetPage";
import { AccessDeniedState } from "@/features/asset-workspace/components/states/states";

export default async function Page({ searchParams }: { searchParams: Promise<{ mode?: string | string[]; category_id?: string | string[] }> }) {
  const [params, session] = await Promise.all([searchParams, getSession()]);
  if (session === "forbidden" || !session.tenantId || !session.userId) return <AccessDeniedState />;
  return <RegisterAssetPage single={params.mode === "single"} tenantId={session.tenantId} userId={session.userId}
    initialCategoryId={params.mode === "single" ? params.category_id : undefined} />;
}
