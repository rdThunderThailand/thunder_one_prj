import { Button } from "@/components/ui/lovable/button";
import { LoadingState } from "../states/states";
import type { RegistrationSelector } from "../../hooks/use-registration-selector";
import { SpinnerIcon } from "@/components/ui/icons";

export function RegistrationSelectorStatus({ selector, people = false }: { selector: RegistrationSelector; people?: boolean }) {
  return (
    <div className="space-y-3 text-xs leading-relaxed">
      {selector.busy && (
        <div className="space-y-3 rounded-control bg-muted p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p role="status" className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <SpinnerIcon aria-hidden="true" className="size-4 shrink-0 animate-spin motion-reduce:animate-none" />
              {people ? "Still searching eligible people…" : "Loading references…"}
            </p>
            <Button variant="outline" size="sm" className="max-sm:h-10" onClick={selector.cancel}>
              Cancel search
            </Button>
          </div>
          {!selector.items.length && (
            <div aria-hidden="true">
              <LoadingState rows={2} />
            </div>
          )}
        </div>
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
        <p role="status" className="rounded-control bg-muted p-3 text-muted-foreground">
          {selector.search.trim()
            ? "No matching references. Try another search."
            : selector.trail.length
              ? "No child references. This parent can still be selected."
              : "No eligible references are available."}
        </p>
      )}
      {!selector.busy && !selector.error && selector.page?.hasMore && (
        <Button variant="outline" size="sm" className="max-sm:h-10" onClick={selector.more}>
          Load more
        </Button>
      )}
    </div>
  );
}
