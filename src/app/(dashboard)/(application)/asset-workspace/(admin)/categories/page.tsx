import Link from "next/link";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { Button } from "@/components/ui/lovable/button";
import { CategoriesListView } from "@/features/asset-workspace/components/categories/CategoriesListView";
import { AccessDeniedState, EmptyState } from "@/features/asset-workspace/components/states/states";
import { startCategoryList } from "@/features/asset-workspace/services/category-first-data";

export default async function CategoriesPage() {
  const [session, token] = await Promise.all([getSession(), getAuthToken()]);
  if (!token) {
    return (
      <EmptyState
        title="Sign in to view categories"
        body="Sign in again to view categories."
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
  const seed = await startCategoryList(token, session.tenantId, context);
  return <CategoriesListView key={context} context={context} seed={seed} />;
}
