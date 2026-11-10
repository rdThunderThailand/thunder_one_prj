"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/lovable/button";
import { ArrowLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { categoryDetailHref } from "../../domain/category-detail";
import { useCategoryDetail } from "../../hooks/use-category-detail";
import { useCategoryListData } from "../../hooks/use-category-list-data";
import { AccessDeniedState, EmptyState, NotFoundState } from "../states/states";
import { ErrorState } from "../states/ErrorState";
import { CategoriesWorkspace } from "./CategoriesWorkspace";
import { EditCategoryForm } from "./EditCategoryForm";
import { CategoryEditFormLoading } from "./CategoryEditLoading";

export function EditCategoryView({ context, categoryId }: { context: string; categoryId: string }) {
  const detail = useCategoryDetail(context, categoryId);
  const parents = useCategoryListData(context);
  const href = categoryDetailHref(categoryId);
  let state;
  if (detail.error?.status === 400 || detail.error?.status === 404) {
    state = <NotFoundState title="Category not found" action={
      <Button asChild variant="outline" size="sm">
        <Link href="/asset-workspace/categories">Back to Categories</Link>
      </Button>
    } />;
  } else if (detail.error?.status === 401) {
    state = <EmptyState title="Sign in to edit this category" body={detail.error.message} action={
      <Button asChild variant="outline" size="sm">
        <Link href="/login">Sign in</Link>
      </Button>
    } />;
  } else if (detail.error?.status === 403) state = <AccessDeniedState body={detail.error.message} />;
  else if (detail.error) state = <ErrorState title="Couldn't load this category" body={detail.error.message} onRetry={detail.retry} />;

  return (
    <CategoriesWorkspace>
      <div className="min-w-0 space-y-2">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/asset-workspace/categories" className="inline-flex min-h-8 items-center rounded-xs text-accent-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring">Categories</Link>
            </li>
            <li aria-hidden="true">
              <ChevronRightIcon className="size-3" />
            </li>
            <li className="min-w-0 break-words">
              <Link href={href} className="inline-flex min-h-8 items-center rounded-xs text-accent-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring">{detail.data?.name ?? "Category"}</Link>
            </li>
            <li aria-hidden="true">
              <ChevronRightIcon className="size-3" />
            </li>
            <li aria-current="page" className="font-medium text-foreground">Edit</li>
          </ol>
        </nav>
        <div className="flex items-start gap-3">
          <Button asChild variant="outline" size="icon" className="shrink-0">
            <Link href={href} aria-label="Back to category">
              <ArrowLeftIcon aria-hidden="true" className="size-4" />
            </Link>
          </Button>
          <PageHeader title="Edit Category" subtitle="Update category information and rules." />
        </div>
      </div>
      {detail.pending ? <CategoryEditFormLoading /> : state ? (
        <div data-category-results className="min-h-0 overflow-y-auto p-1 group-data-[bounded=true]/categories-workspace:flex-1 group-data-[bounded=true]/categories-workspace:shrink">{state}</div>
      ) : detail.data && (
        <EditCategoryForm key={detail.data.updatedAt} context={context} category={detail.data}
          categories={parents.data ?? []} parentsPending={parents.pending} parentsError={parents.error?.message}
          reloadParents={parents.retry} reload={detail.retry} reloading={detail.pending} />
      )}
    </CategoriesWorkspace>
  );
}
