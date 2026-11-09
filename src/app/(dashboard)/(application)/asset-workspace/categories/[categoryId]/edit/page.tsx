import Link from "next/link";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { Button } from "@/components/ui/lovable/button";
import { EditCategoryView } from "@/features/asset-workspace/components/categories/EditCategoryView";
import { AccessDeniedState, EmptyState } from "@/features/asset-workspace/components/states/states";

export default async function EditCategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const [{ categoryId }, session, token] = await Promise.all([params, getSession(), getAuthToken()]);
  if (!token) {
    return (
      <EmptyState title="Sign in to edit this category" body="Sign in again to update category details." action={
        <Button asChild variant="outline" size="sm">
          <Link href="/login">Sign in</Link>
        </Button>
      } />
    );
  }
  if (session === "forbidden" || !session.tenantId || !session.userId) return <AccessDeniedState />;
  const context = `${session.tenantId}:${session.userId}`;
  return <EditCategoryView key={`${context}:${categoryId}`} context={context} categoryId={categoryId} />;
}
