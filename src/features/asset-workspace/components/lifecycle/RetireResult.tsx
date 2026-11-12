import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { CheckCircleIcon, CheckIcon, CopyIcon, FileTextIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import type { RetireFlow } from "../../hooks/use-retire-flow";
import { formatDay } from "../asset-profile/ProfileParts";
import { LifecycleCondition, LifecycleStatus } from "./LifecycleSummary";
import { LifecycleAssetInfo, LifecycleTable } from "./RetireReview";

export function RetireResult({ saved, photo }: { saved: NonNullable<RetireFlow["saved"]>; photo: string | null }) {
  const { before, after, draft, historyId, confirmedAt } = saved;
  const [copy, setCopy] = useState("");
  const day = formatDay(confirmedAt);
  const lines = [
    ["Asset retired:", `The asset has been marked as Retired on ${day}.`],
    ["No longer available for assignment:", "The asset will not appear in available assets for new assignments."],
    ["History recorded:", "This action has been recorded in the asset's status history and audit log."],
    ["Next step (optional):", "You may dispose of this asset later through a separate Dispose action."],
  ];

  async function copyId() {
    try {
      await navigator.clipboard.writeText(historyId);
      setCopy("Transaction ID copied.");
    } catch {
      setCopy("Couldn’t copy the Transaction ID.");
    }
  }

  return (
    <div className="space-y-3">
      <section className="flex items-start gap-3.5 rounded-card border border-success/25 bg-success-muted/70 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success text-primary-foreground">
          <CheckIcon aria-hidden="true" className="size-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">Asset Retired Successfully</h2>
          <p className="text-xs text-muted-foreground">The asset has been retired and is no longer available for normal use.</p>
        </div>
      </section>
      <Card className="space-y-3 p-4">
        <LifecycleAssetInfo
          asset={after}
          photo={photo}
          rows={[
            ["Serial Number", after.serialNumber || "—"],
            ["Category", after.category?.name || "—"],
            ["Brand / Model", "—"],
          ]}
        />
      </Card>
      <Card className="space-y-3 p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileTextIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
          Retirement Summary
        </h2>
        <LifecycleTable rows={[
          ["Retirement Date", <time key="date" dateTime={confirmedAt}>{day}</time>],
          ["Reason for Retirement", draft.reason.trim()],
          ["Condition at Retirement", <LifecycleCondition key="condition" value={after.condition} />],
          ["Previous Status", <LifecycleStatus key="before" value={before.lifecycleStatus} />],
          ["Current Status", <LifecycleStatus key="after" value={after.lifecycleStatus} />],
          ["Transaction ID", (
            <div key="id" className="flex min-w-0 items-center gap-1.5">
              <span className="min-w-0 truncate font-mono" title={historyId}>{historyId}</span>
              <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" aria-label="Copy Transaction ID" onClick={copyId}>
                <CopyIcon aria-hidden="true" className="size-3.5" />
              </Button>
            </div>
          )],
        ]} />
        {copy && <p aria-live="polite" className="text-2xs text-muted-foreground">{copy}</p>}
      </Card>
      <Card className="space-y-3 p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CheckCircleIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
          Result
        </h2>
        <ul className="space-y-1.5 rounded-control bg-accent/60 p-3 text-xs text-foreground/90">
          {lines.map(([lead, text]) => (
            <li key={lead} className="flex items-start gap-2">
              <CheckCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                <strong className="font-semibold text-foreground">{lead}</strong>
                {" "}
                {text}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
