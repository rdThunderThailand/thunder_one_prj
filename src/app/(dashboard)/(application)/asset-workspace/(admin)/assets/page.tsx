import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { AssetsListView } from "@/features/asset-workspace/components/assets-list/AssetsListView";
import { getWorkspacePreferences } from "@/features/asset-workspace/services/asset-settings-api";
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
  // The org's page size and sort start the list when the URL names none; any failure keeps the built-in defaults.
  const preferences = await getWorkspacePreferences();
  return (
    <AssetsListView
      key={context}
      context={context}
      listDefaults={preferences ? { pageSize: preferences.pageSize, sort: preferences.sort } : undefined}
    />
  );
}
