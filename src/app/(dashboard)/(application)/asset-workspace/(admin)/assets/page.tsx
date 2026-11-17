import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { AssetsListView } from "@/features/asset-workspace/components/assets-list/AssetsListView";
import { AccessDeniedState, EmptyState } from "@/features/asset-workspace/components/states/states";
import { Button } from "@/components/ui/lovable/button";

export default async function AssetsPage() {
  const [session, token] = await Promise.all([getSession(), getAuthToken()]);
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
  return <AssetsListView key={context} context={context} />;
}
