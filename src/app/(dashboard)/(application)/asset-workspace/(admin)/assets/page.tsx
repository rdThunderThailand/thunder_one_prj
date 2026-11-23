import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { AssetsListView } from "@/features/asset-workspace/components/assets-list/AssetsListView";
import type { AssetSearchParams } from "@/features/asset-workspace/services/assets-list-query";
import { startAssetsFirstData } from "@/features/asset-workspace/services/assets-list-server";
import { AccessDeniedState, EmptyState } from "@/features/asset-workspace/components/states/states";
import { Button } from "@/components/ui/lovable/button";

export default async function AssetsPage({ searchParams }: { searchParams: Promise<AssetSearchParams> }) {
  const [session, token, params] = await Promise.all([getSession(), getAuthToken(), searchParams]);
  if (!token) {
    return (
      <EmptyState
        title="Sign in to view assets" body="Sign in again to view assets."
        action={
          <Button asChild variant="outline" size="sm">
            <a href="/login">Sign in</a>
          </Button>
        }
      />
    );
  }
  if (session === "forbidden" || !session.tenantId || !session.userId) return <AccessDeniedState />;
  const context = `${session.tenantId}:${session.userId}`;
  const { listDefaults, seeds } = await startAssetsFirstData(token, session.tenantId, params);
  return (
    <AssetsListView
      key={context}
      context={context}
      listDefaults={listDefaults}
      seeds={seeds}
    />
  );
}
