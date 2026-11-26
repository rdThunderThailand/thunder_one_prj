import { CheckCircleIcon } from "@/components/ui/icons";
import type { DisposeFlow } from "../../hooks/use-dispose-flow";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { LifecycleAssetCard, LifecycleNotice } from "./LifecycleSummary";

const NOTES = [
  ["Disposed assets cannot be restored.", "Dispose action will be recorded in the Audit Log.", "You can still view the asset history and record."],
  ["Please ensure the asset has been retired.", "Disposed assets cannot be restored.",
    "This action can only be performed by authorized users.", "The disposal record will be kept for audit and compliance."],
  ["Disposed assets cannot be restored.", "Ensure you have a valid disposal certificate.",
    "Follow company policy and local e-waste regulation.", "This action can only be performed by authorized users."],
];

const DISPOSE_OUTCOMES = [
  "The asset status will change from Retired → Disposed.",
  "The asset will be removed from active inventory.",
  "A disposal record will be created in Asset History and Audit Log.",
  "You can still view the asset record in history.",
  "This action cannot be undone.",
];

export function DisposeSummary({ asset, flow }: { asset: AssetDetail; flow: DisposeFlow }) {
  const checklist = [
    ["Disposal method is specified", !flow.errors.method],
    ["Reason and details are provided", !flow.errors.reason],
  ] as const;
  return (
    <aside aria-label="Asset Summary" className="min-w-0 space-y-3">
      <LifecycleAssetCard asset={asset} photo={flow.photo} files={flow.files} recent={flow.recent} />
      {flow.step === 0 && (
        <LifecycleNotice
          title="Before You Dispose"
          lines={[
            "The asset must be in Retired status before disposal.",
            "Please follow company policy and local regulation for e-waste disposal.",
            "Keep the disposal certificate / reference for audit.",
            "The asset leaves active use; its record and history are kept.",
          ]}
        />
      )}
      {flow.step === 1 && (
        <section className="space-y-2 rounded-card border border-primary/15 bg-accent/60 p-3.5">
          <h3 className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <CheckCircleIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
            Checklist
          </h3>
          <ul className="space-y-1.5 text-xs text-foreground/90">
            {checklist.map(([label, ok]) => (
              <li key={label} className="flex items-start gap-2">
                <CheckCircleIcon aria-hidden="true" className={`mt-0.5 size-4 shrink-0 ${ok ? "text-primary" : "text-muted-foreground"}`} />
                <span>{label}</span>
                <span className="sr-only">{ok ? "(done)" : "(missing)"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {flow.step === 2 && <LifecycleNotice title="After You Confirm" lines={DISPOSE_OUTCOMES} />}
      <LifecycleNotice title="Important Notes" lines={NOTES[flow.step] ?? NOTES[0]} kind="notes" />
    </aside>
  );
}
