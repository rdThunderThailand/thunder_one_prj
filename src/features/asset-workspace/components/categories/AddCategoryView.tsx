"use client";

import { useRef, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/lovable/button";
import { ChevronRightIcon, PlusIcon } from "@/components/ui/icons";
import { activeCategoryParents, type CategoryField } from "../../domain/category-form";
import { useCategoryListData } from "../../hooks/use-category-list-data";
import { useCategoryCreate } from "../../hooks/use-category-create";
import { AccessDeniedState, EmptyState, LoadingState } from "../states/states";
import { ErrorState } from "../states/ErrorState";
import { CategoriesWorkspace } from "./CategoriesWorkspace";
import { CategoryInformation, CategoryRules, categoryFieldTargets } from "./CategoryFormFields";
import { CategoryFormPreview } from "./CategoryFormPreview";

const listHref = "/asset-workspace/categories";

export function AddCategoryView({ context }: { context: string }) {
  const router = useRouter();
  const parents = useCategoryListData(context);
  const flow = useCategoryCreate(context, parents.retry);
  const summary = useRef<HTMLDivElement>(null);
  const issues = (Object.keys(categoryFieldTargets) as CategoryField[]).filter((key) => flow.fields[key]);
  const navigating = flow.phase === "submitting" || flow.phase === "success";
  const checkHref = `${listHref}?${new URLSearchParams({ q: flow.draft.name.trim() })}`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (parents.pending || parents.error) return;
    const created = await flow.submit();
    if (created) {
      toast.success(`${created.name} created.`);
      router.push(`${listHref}/${encodeURIComponent(created.id)}`);
    } else {
      requestAnimationFrame(() => summary.current?.focus());
    }
  }

  let fields;
  if (parents.pending) {
    fields = (
      <div className="grid gap-3 @min-4xl/category-form:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
        <LoadingState rows={6} />
        <div className="hidden @min-4xl/category-form:block">
          <LoadingState rows={4} />
        </div>
      </div>
    );
  }
  else if (parents.error?.status === 403) fields = <AccessDeniedState body={parents.error.message} />;
  else if (parents.error?.status === 401) {
    fields = (
      <EmptyState title="Sign in to add a category" body="Your session has expired. Leaving this page may lose your input."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        }
      />
    );
  } else if (parents.error) {
    fields = <ErrorState title="Couldn't load parent categories" body={parents.error.message} onRetry={parents.retry} />;
  } else {
    fields = (
      <div className="grid items-start gap-3 @min-4xl/category-form:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3">
          <CategoryInformation flow={flow} parents={activeCategoryParents(parents.data ?? [])} />
          <CategoryRules flow={flow} />
        </div>
        <CategoryFormPreview
          draft={flow.draft}
          parentName={flow.draft.parentId
            ? parents.data?.find((parent) => parent.id === flow.draft.parentId)?.name ?? "Selected parent — unavailable"
            : "None (Top level)"}
        />
      </div>
    );
  }

  return (
    <CategoriesWorkspace>
      <div className="min-w-0 space-y-2">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              {flow.locked ? <span>Categories</span> : (
                <Link href={listHref} className="inline-flex min-h-8 items-center rounded-control hover:text-accent-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring">
                  Categories
                </Link>
              )}
            </li>
            <li aria-hidden="true">
              <ChevronRightIcon className="size-3" />
            </li>
            <li aria-current="page" className="font-medium text-foreground">Add Category</li>
          </ol>
        </nav>
        <PageHeader title="Add Category" subtitle="Create a new asset category for organizing similar assets." />
      </div>
      <form
        noValidate
        onSubmit={submit}
        data-category-results
        aria-label="Add category"
        aria-busy={flow.phase === "submitting"}
        className="@container/category-form flex w-full min-w-0 flex-col gap-3 group-data-[bounded=true]/categories-workspace:min-h-0 group-data-[bounded=true]/categories-workspace:flex-1 group-data-[bounded=true]/categories-workspace:shrink"
      >
        <div className="min-w-0 space-y-3 p-1 group-data-[bounded=true]/categories-workspace:min-h-0 group-data-[bounded=true]/categories-workspace:flex-1 group-data-[bounded=true]/categories-workspace:overflow-y-auto">
          {(issues.length > 0 || flow.failure) && (
            <div ref={summary} role="alert" tabIndex={-1} aria-labelledby="category-error-title"
              className="space-y-2 rounded-control border border-error/30 bg-error-muted p-4 focus-visible:outline-2 focus-visible:outline-ring">
              <h2 id="category-error-title" className="text-sm font-semibold text-foreground">
                {flow.failure?.uncertain ? "Check whether the category was created" : "Review your category"}
              </h2>
              <p className="text-xs text-foreground">{flow.failure?.message ?? "Correct the highlighted fields and try again."}</p>
              {issues.length > 0 && (
                <ul className="space-y-1">
                  {issues.map((key) => (
                    <li key={key}>
                      <button type="button" disabled={parents.pending || Boolean(parents.error)}
                        onClick={() => document.getElementById(categoryFieldTargets[key].id)?.focus()}
                        className="rounded-xs text-left text-xs text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50">
                        {categoryFieldTargets[key].label}: {flow.fields[key]}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {flow.failure?.uncertain && (
                <Button asChild variant="outline" size="sm">
                  <Link href={checkHref}>Check category list</Link>
                </Button>
              )}
              {flow.failure?.status === 401 && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/login">Sign in again</Link>
                </Button>
              )}
            </div>
          )}
          {fields}
        </div>
        <footer data-category-controls className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border px-1 py-3">
          <p role="status" className="text-xs text-muted-foreground">
            {flow.phase === "submitting" ? "Creating category…" : flow.phase === "success" ? "Category created. Opening details…"
              : flow.phase === "uncertain" ? "Save outcome unconfirmed. Check the category list." : "New categories start Active."}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="max-sm:h-10" disabled={navigating}
              onClick={() => router.push(flow.failure?.uncertain ? checkHref : listHref)}>
              {flow.failure?.uncertain ? "Check category list" : "Cancel"}
            </Button>
            <Button type="submit" variant="primary" size="sm" className="max-sm:h-10"
              disabled={flow.locked || parents.pending || Boolean(parents.error)}>
              <PlusIcon aria-hidden="true" className="size-4" />
              {flow.phase === "submitting" ? "Creating…" : "Create Category"}
            </Button>
          </div>
        </footer>
      </form>
    </CategoriesWorkspace>
  );
}
