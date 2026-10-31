import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/lovable/button";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { RegistrationMethodChoice } from "@/features/asset-workspace/components/register-asset/RegistrationMethodChoice";
import { SingleAssetWizard } from "@/features/asset-workspace/components/register-asset/SingleAssetWizard";
import { AccessDeniedState, EmptyState } from "@/features/asset-workspace/components/states/states";
import { ErrorState } from "@/features/asset-workspace/components/states/ErrorState";
import { getRegistrationOptions } from "@/features/asset-workspace/services/asset-registration-api";

export default async function RegisterAssetPage({ searchParams }: { searchParams: Promise<{ mode?: string | string[] }> }) {
  const params = await searchParams;
  if (params.mode !== "single") return <RegistrationMethodChoice />;

  const [session, token] = await Promise.all([getSession(), getAuthToken()]);
  const tenantId = session !== "forbidden" ? session.tenantId : null;
  const userId = session !== "forbidden" ? session.userId : null;
  const result = token && tenantId && userId ? await getRegistrationOptions({ tenantId, token })
    : { ok: false as const, status: token ? 403 : 401, message: token ? "Choose an authorized organization to register assets." : "Sign in again to prepare an asset registration." };

  if (result.ok && tenantId && userId) {
    return <SingleAssetWizard key={`${tenantId}:${userId}`} tenantId={tenantId} userId={userId} options={result.data} />;
  }
  const error = result.ok ? null : result;
  return (
    <div className="h-full space-y-4 overflow-y-auto overscroll-contain">
      <PageHeader title="Register Asset" subtitle="Prepare a single asset registration" />
      {error?.status === 401 ? (
        <EmptyState
          title="Sign in required" body={error.message}
          action={<Button asChild size="sm"><Link href="/login">Sign in</Link></Button>}
        />
      ) : error?.status === 403 ? (
        <AccessDeniedState title="Registration is restricted" body={error.message} />
      ) : (
        <ErrorState title="Couldn't load registration options" body={error?.message} />
      )}
      <Button asChild variant="outline" size="sm">
        <Link href="/asset-workspace/assets">Back to Assets</Link>
      </Button>
    </div>
  );
}
