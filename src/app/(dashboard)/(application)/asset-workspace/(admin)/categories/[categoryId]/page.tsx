import Link from "next/link";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { Button } from "@/components/ui/lovable/button";
import { CategoryDetailView } from "@/features/asset-workspace/components/categories/CategoryDetailView";
import { AccessDeniedState, EmptyState } from "@/features/asset-workspace/components/states/states";

export default async function CategoryDetailPage({ params }: {
  params: Promise<{ categoryId: string }>;
}) {
  const [{ categoryId }, session, token] = await Promise.all([params, getSession(), getAuthToken()]);
  if (!token) {
    return (
      <EmptyState title="Sign in to view this category" body="Sign in again to load category details." action={
        <Button asChild variant="outline" size="sm">
          <Link href="/login">Sign in</Link>
        </Button>
      } />
    );
  }
  if (session === "forbidden" || !session.tenantId || !session.userId) return <AccessDeniedState />;
  const context = `${session.tenantId}:${session.userId}`;
  return <CategoryDetailView key={`${context}:${categoryId}`} context={context} categoryId={categoryId} />;
}
