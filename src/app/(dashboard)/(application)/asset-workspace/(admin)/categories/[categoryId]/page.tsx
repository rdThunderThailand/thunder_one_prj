import Link from "next/link";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { Button } from "@/components/ui/lovable/button";
import { CategoryDetailView } from "@/features/asset-workspace/components/categories/CategoryDetailView";
import { AccessDeniedState, EmptyState } from "@/features/asset-workspace/components/states/states";
import { startCategoryDetail } from "@/features/asset-workspace/services/category-first-data";

export default async function CategoryDetailPage({ params, searchParams }: {
  params: Promise<{ categoryId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ categoryId }, search, session, token] = await Promise.all([params, searchParams, getSession(), getAuthToken()]);
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
  const firstData = await startCategoryDetail(token, session.tenantId, context, categoryId, search);
  return <CategoryDetailView key={`${context}:${categoryId}`} context={context} categoryId={categoryId} firstData={firstData} />;
}
