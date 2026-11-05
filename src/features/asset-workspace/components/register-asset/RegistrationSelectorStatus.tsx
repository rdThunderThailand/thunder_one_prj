import { Button } from "@/components/ui/lovable/button";
import { LoadingState } from "../states/states";
import { Skeleton } from "@/components/ui/Skeleton";
import type { RegistrationSelector } from "../../hooks/use-registration-selector";
import { SpinnerIcon } from "@/components/ui/icons";
import { RegistrationCategoryGrid } from "./RegistrationCategoryCard";

export function RegistrationSelectorStatus({ selector, people = false, cards = false }: { selector: RegistrationSelector; people?: boolean; cards?: boolean }) {
  if (cards) return <CategorySelectorStatus selector={selector} />;

  return (
    <div className="space-y-2 text-xs">
      {selector.busy && (
        <div role="status" className="space-y-2">
          <p>{people ? "Still searching eligible people…" : "Loading references…"}</p>
          {!selector.items.length && <LoadingState rows={2} />}
          <Button variant="outline" size="sm" onClick={selector.cancel}>Cancel search</Button>
        </div>
      )}
      {selector.error && (
        <div className="space-y-2">
          <p role="alert" className="text-error">{selector.error}</p>
          <Button variant="outline" size="sm" onClick={selector.more}>Retry search</Button>
        </div>
      )}
      {selector.finalEmpty && <p role="status" className="py-3 text-muted-foreground">{selector.search.trim() ? "No matching references. Try another search." : selector.trail.length ? "No child references. This parent can still be selected." : "No eligible references are available."}</p>}
      {!selector.busy && !selector.error && selector.page?.hasMore && <Button variant="outline" size="sm" onClick={selector.more}>Load more</Button>}
    </div>
  );
}

function CategorySelectorStatus({ selector }: { selector: RegistrationSelector }) {
  return (
    <div className="space-y-3 text-xs leading-relaxed">
      {selector.busy && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-control bg-muted px-3 py-2">
            <p role="status" className="flex items-center gap-2 text-muted-foreground">
              <SpinnerIcon aria-hidden="true" className="size-4 shrink-0 animate-spin motion-reduce:animate-none" />
              Loading categories…
            </p>
            <Button variant="outline" size="sm" className="max-sm:h-10" onClick={selector.cancel}>
              Cancel search
            </Button>
          </div>
          {!selector.items.length && (
            <div aria-hidden="true">
              <RegistrationCategoryGrid>
                {Array.from({ length: 8 }, (_, index) => (
                  <Skeleton key={index} className="h-36 rounded-control motion-reduce:animate-none" />
                ))}
              </RegistrationCategoryGrid>
            </div>
          )}
        </>
      )}
      {selector.error && (
        <div className="space-y-3 rounded-control bg-error-muted p-3 text-foreground">
          <p role="alert">{selector.error}</p>
          <Button variant="outline" size="sm" className="max-sm:h-10" onClick={selector.more}>
            Retry search
          </Button>
        </div>
      )}
      {selector.finalEmpty && (
        <p role="status" className="rounded-control bg-muted p-4 text-muted-foreground">
          {selector.search.trim()
            ? "No matching categories. Try another search."
            : selector.trail.length
              ? "No child categories. This parent can still be selected."
              : "No eligible categories are available."}
        </p>
      )}
      {!selector.busy && !selector.error && selector.page?.hasMore && (
        <Button variant="outline" size="sm" className="max-sm:h-10" onClick={selector.more}>
          Load more categories
        </Button>
      )}
    </div>
  );
}
