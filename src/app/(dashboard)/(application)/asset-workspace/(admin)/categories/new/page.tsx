import Link from "next/link";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { Button } from "@/components/ui/lovable/button";
import { AddCategoryView } from "@/features/asset-workspace/components/categories/AddCategoryView";
import { AccessDeniedState, EmptyState } from "@/features/asset-workspace/components/states/states";

export default async function AddCategoryPage() {
  const [session, token] = await Promise.all([getSession(), getAuthToken()]);
  if (!token) {
    return (
      <EmptyState
        title="Sign in to add a category"
        body="Sign in again to create a category."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        }
      />
    );
  }
  if (session === "forbidden" || !session.tenantId || !session.userId) return <AccessDeniedState />;
  const context = `${session.tenantId}:${session.userId}`;
  return <AddCategoryView key={context} context={context} />;
}
