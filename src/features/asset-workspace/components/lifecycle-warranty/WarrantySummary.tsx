import { WarrantyIcon } from "@/components/ui/icons";
import { assignmentDate } from "../../domain/assignment-current";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { LifecycleAssetCard, LifecycleNotice } from "../lifecycle/LifecycleSummary";
import { LifecycleTable } from "../lifecycle/RetireReview";
import type { WarrantyFlow } from "./use-warranty-flow";

const NOTES = [
  "Only one warranty is current at a time; earlier ones stay in history.",
  "Attach at most two documents per warranty (PDF, JPEG or PNG, 10 MB each).",
  "Warranties of disposed assets are view only.",
];

/** Right rail: the asset and its current warranty (spec: copy RetireSummary). */
export function WarrantySummary({ asset, flow }: { asset: AssetDetail; flow: WarrantyFlow }) {
  const current = flow.list?.find((item) => item.isCurrent) ?? null;
  return (
    <aside aria-label="Asset Summary" className="min-w-0 space-y-3">
      <LifecycleAssetCard asset={asset} photo={flow.photo} files={flow.files} recent={flow.recent} />
      <section className="space-y-3 rounded-card border border-border bg-card p-4">
        <h3 className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <WarrantyIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
          Current Warranty
        </h3>
        {current ? (
          <LifecycleTable rows={[
            ["Provider", current.provider || "—"],
            ["Warranty Type", current.type || "—"],
            ["End Date", current.endDate ? assignmentDate(current.endDate) : "—"],
          ]} />
        ) : (
          <p className="text-xs text-muted-foreground">{flow.list ? "No current warranty." : "Loading…"}</p>
        )}
      </section>
      <LifecycleNotice title="Important Notes" lines={NOTES} kind="notes" />
    </aside>
  );
}
