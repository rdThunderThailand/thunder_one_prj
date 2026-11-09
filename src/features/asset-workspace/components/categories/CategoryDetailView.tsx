"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/lovable/tabs";
import { ChevronRightIcon } from "@/components/ui/icons";
import { useCategoryDetail } from "../../hooks/use-category-detail";
import { AccessDeniedState, EmptyState, LoadingState, NotFoundState } from "../states/states";
import { ErrorState } from "../states/ErrorState";
import { CategoriesWorkspace } from "./CategoriesWorkspace";
import { CategoryDetailHeader } from "./CategoryDetailHeader";
import { CategoryOverviewCards } from "./CategoryOverviewCards";
import { CategoryChildrenSection } from "./CategoryChildrenSection";

const listHref = "/asset-workspace/categories";

export function CategoryDetailView({ context, categoryId }: { context: string; categoryId: string }) {
  const detail = useCategoryDetail(context, categoryId);
  const feedback = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (detail.failure) feedback.current?.focus();
  }, [detail.failure]);
  const category = detail.data;
  const back = (
    <Button asChild variant="outline" size="sm">
      <Link href={listHref}>Back to Categories</Link>
    </Button>
  );
  let state;
  if (detail.error?.status === 400 || detail.error?.status === 404) {
    state = <NotFoundState title="Category not found" body="This category doesn't exist or is no longer available in your organization." action={back} />;
  } else if (detail.error?.status === 401) {
    state = (
      <EmptyState title="Sign in to view this category" body={detail.error.message} action={
        <Button asChild variant="outline" size="sm">
          <Link href="/login">Sign in</Link>
        </Button>
      } />
    );
  } else if (detail.error?.status === 403) state = <AccessDeniedState body={detail.error.message} action={back} />;
  else if (detail.error) state = <ErrorState title="Couldn't load this category" body={detail.error.message} onRetry={detail.retry} />;
  else if (!category) state = <LoadingState rows={8} />;

  return (
    <CategoriesWorkspace>
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <ol className="flex min-w-0 flex-wrap items-center gap-1">
          <li>
            <Link href={listHref} className="inline-flex min-h-8 items-center rounded-xs text-accent-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
              Categories
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRightIcon className="size-3" />
          </li>
          <li aria-current="page" className="min-w-0 break-words font-medium text-foreground">{category?.name ?? "Category Detail"}</li>
        </ol>
      </nav>
      {category && !detail.error && (
        <CategoryDetailHeader category={category} busy={detail.sending || detail.pending}
          sending={detail.sending} onStatus={detail.changeStatus} />
      )}
      {detail.failure && (
        <div ref={feedback} role="alert" tabIndex={-1} className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-border bg-muted px-4 py-3 text-xs focus-visible:outline-2 focus-visible:outline-ring">
          <p className="min-w-0 flex-1 basis-64">{detail.failure.message}</p>
          {detail.failure.status === 401 ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled={detail.sending || detail.pending} onClick={detail.retry}>Reload category</Button>
          )}
        </div>
      )}
      <div data-category-results
        className="flex min-w-0 flex-col group-data-[bounded=true]/categories-workspace:min-h-0 group-data-[bounded=true]/categories-workspace:flex-1 group-data-[bounded=true]/categories-workspace:shrink">
        {state ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-1">{state}</div>
        ) : category && (
          <Tabs value="overview" className="flex min-h-0 min-w-0 flex-1 flex-col" aria-busy={detail.pending || detail.sending}>
            <div data-category-controls className="shrink-0 border-b border-border">
              <TabsList aria-label="Category details" className="h-10 justify-start gap-1 rounded-none bg-transparent p-0">
                <TabsTrigger value="overview" className="h-10 rounded-t-control rounded-b-none border-b-2 border-transparent px-6 data-[state=active]:border-primary data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-none">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="assets" disabled className="h-10 rounded-t-control rounded-b-none px-6">Assets</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="overview" className="@container/category-detail mt-0 min-w-0 space-y-3 p-1 pt-3 group-data-[bounded=true]/categories-workspace:min-h-0 group-data-[bounded=true]/categories-workspace:flex-1 group-data-[bounded=true]/categories-workspace:overflow-y-auto">
              {detail.pending && <p role="status" className="px-1 text-xs text-muted-foreground">Refreshing category…</p>}
              <CategoryOverviewCards category={category} />
              <CategoryChildrenSection categories={category.children} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </CategoriesWorkspace>
  );
}
