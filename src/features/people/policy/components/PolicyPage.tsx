import { PolicyCategoriesCard } from "./PolicyCategoriesCard";
import { PolicyFilterBar } from "./PolicyFilterBar";
import { PolicyHeader } from "./PolicyHeader";
import { PolicyStatTilesRow } from "./PolicyStatTilesRow";
import { PolicyTable } from "./PolicyTable";
import { PolicyTableControls } from "./PolicyTableControls";

// HR Manager — policy library (`/people/policy`). No selection/detail-panel
// state needed (unlike people/new-hires or people/departures) — this mockup
// is a plain browsing list, so the whole page is a Server Component.
export function PolicyPage() {
  return (
    <div className="flex flex-col gap-6">
      <PolicyHeader />
      <PolicyStatTilesRow />
      <PolicyFilterBar />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <PolicyCategoriesCard />
        </div>
        <div className="flex flex-col gap-4 lg:col-span-3">
          <PolicyTable />
          <PolicyTableControls />
        </div>
      </div>
    </div>
  );
}
