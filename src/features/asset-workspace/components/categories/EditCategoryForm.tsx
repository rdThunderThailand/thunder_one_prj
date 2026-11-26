"use client";

import { useRef, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/lovable/button";
import { InfoIcon } from "@/components/ui/icons";
import type { AssetCategory, AssetCategoryDetail } from "../../domain/asset-category";
import { categoryDetailHref } from "../../domain/category-detail";
import { useCategoryEdit } from "../../hooks/use-category-edit";
import { CategoryEditFields } from "./CategoryEditFields";
import { CategoryRules } from "./CategoryFormFields";

export function EditCategoryForm({ context, category, categories, parentsPending, parentsError, reloadParents, reload, reloading }: {
  context: string;
  category: AssetCategoryDetail;
  categories: AssetCategory[];
  parentsPending: boolean;
  parentsError?: string;
  reloadParents: () => void;
  reload: () => void;
  reloading: boolean;
}) {
  const flow = useCategoryEdit(context, category, reloadParents);
  const router = useRouter();
  const feedback = useRef<HTMLDivElement>(null);
  const href = categoryDetailHref(category.id);
  const errors = Object.values(flow.fields).filter(Boolean);
  const rulesFlow = { ...flow, locked: flow.locked || reloading };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (parentsPending || parentsError || reloading) return;
    const saved = await flow.submit();
    if (saved) {
      toast.success(`${saved.name} updated.`);
      router.push(href);
      router.refresh();
    } else requestAnimationFrame(() => feedback.current?.focus());
  }

  return (
    <form noValidate onSubmit={submit} data-category-results aria-label="Edit category"
      aria-busy={flow.phase === "sending" || reloading}
      className="@container/category-form flex min-w-0 flex-col gap-3 group-data-[bounded=true]/categories-workspace:min-h-0 group-data-[bounded=true]/categories-workspace:flex-1 group-data-[bounded=true]/categories-workspace:shrink">
      <div className="min-w-0 space-y-3 p-1 group-data-[bounded=true]/categories-workspace:min-h-0 group-data-[bounded=true]/categories-workspace:flex-1 group-data-[bounded=true]/categories-workspace:overflow-y-auto">
        {(flow.failure || errors.length > 0) && (
          <div ref={feedback} role="alert" tabIndex={-1}
            className="space-y-2 rounded-control border border-error/30 bg-error-muted p-4 text-xs focus-visible:outline-2 focus-visible:outline-ring">
            <p>{flow.failure?.message ?? "Review the highlighted fields."}</p>
            {errors.map((message, index) => <p key={index}>{message}</p>)}
            {flow.failure?.code === "STALE" && (
              <Button variant="outline" size="sm" disabled={reloading} onClick={reload}>Reload and replace form</Button>
            )}
            {flow.failure?.uncertain && (
              <Button asChild variant="outline" size="sm">
                <Link href={href}>Open latest Detail</Link>
              </Button>
            )}
            {flow.failure?.status === 401 && (
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
            )}
          </div>
        )}
        {(parentsPending || parentsError || reloading) && (
          <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-border bg-muted p-3 text-xs">
            <p>{reloading ? "Reloading category…" : parentsPending ? "Loading parent options…" : parentsError}</p>
            {parentsError && <Button variant="outline" size="sm" onClick={reloadParents}>Reload parent options</Button>}
          </div>
        )}
        <div className="grid items-start gap-3 @min-4xl/category-form:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-3">
            <CategoryEditFields category={category} flow={rulesFlow} categories={categories} parentsPending={parentsPending || Boolean(parentsError)} />
            <CategoryRules flow={rulesFlow} stacked />
          </div>
          <aside aria-labelledby="about-categories-title" className="flex items-start gap-3 rounded-control bg-accent p-4">
            <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-foreground" />
            <div className="space-y-2 text-xs leading-relaxed">
              <h2 id="about-categories-title" className="font-semibold text-accent-foreground">About Categories</h2>
              <p>Categories organize assets. Set a parent category, description and serial number rule for this category.</p>
              <p>Changing the serial number rule does not modify existing assets. It applies to new registrations and asset category changes.</p>
            </div>
          </aside>
        </div>
      </div>
      <footer data-category-controls className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-background pt-3">
        <Button variant="outline" size="sm" className="max-sm:h-10" disabled={flow.phase === "sending" || flow.phase === "success"}
          onClick={() => router.push(href)}>Cancel</Button>
        <Button type="submit" size="sm" className="max-sm:h-10"
          disabled={!flow.canSave || parentsPending || Boolean(parentsError) || reloading}>
          {flow.phase === "sending" ? "Saving…" : flow.phase === "success" ? "Saved" : "Save Changes"}
        </Button>
      </footer>
    </form>
  );
}
