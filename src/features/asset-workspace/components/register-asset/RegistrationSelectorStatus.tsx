import { Button } from "@/components/ui/lovable/button";
import { LoadingState } from "../states/states";
import { Skeleton } from "@/components/ui/Skeleton";
import type { RegistrationSelector } from "../../hooks/use-registration-selector";

export function RegistrationSelectorStatus({ selector, people = false, cards = false }: { selector: RegistrationSelector; people?: boolean; cards?: boolean }) {
  return (
    <div className="space-y-2 text-xs">
      {selector.busy && (
        <div role="status" className="space-y-2">
          <p>{people ? "Still searching eligible people…" : "Loading references…"}</p>
          {!selector.items.length && (cards ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="h-28 rounded-control" />)}
            </div>
          ) : <LoadingState rows={2} />)}
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
