import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { CalendarIcon, CheckCircleIcon, CheckIcon, CopyIcon, InfoIcon, LocationIcon, UserIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { locationTrail } from "../../domain/asset-profile";
import type { ChangeStatusFlow } from "../../hooks/use-change-status-flow";
import { formatDateTime } from "../asset-profile/ProfileParts";
import { ChangeStatusComparison } from "./ChangeStatusReview";
import { LifecycleCondition, LifecycleHolder, LifecycleStatus, LifecycleValues } from "./LifecycleSummary";

export function ChangeStatusResult({ saved, actor }: { saved: NonNullable<ChangeStatusFlow["saved"]>; actor: string }) {
  const { before, after, draft, historyId, confirmedAt } = saved;
  const [copy, setCopy] = useState("");
  const custodyEnded = Boolean(before.custody && !after.custody);
  const custodyUnchanged = Boolean(after.custody && before.custody?.id === after.custody?.id);
  const beforeLocation = locationTrail(before.locationPath, before.location) || "—";
  const afterLocation = locationTrail(after.locationPath, after.location) || "—";
  const lines = [
    "A record has been created in Status History.",
    "Audit log has been recorded.",
    `The asset will now appear in ${after.lifecycleStatus} status and ${after.condition ?? "—"} condition.`,
    ...(custodyEnded ? [`Custody of ${before.custody?.name ?? "the previous custodian"} has ended. Use Assign to assign the asset again.`]
      : after.custody ? [`The current custodian (${after.custody.name ?? "current holder"}) remains assigned.`] : []),
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
      <section className="grid items-center gap-4 rounded-card border border-success/25 bg-success-muted/70 p-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex items-start gap-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success text-primary-foreground">
            <CheckIcon aria-hidden="true" className="size-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Status / Condition Updated Successfully</h2>
            <p className="text-xs text-muted-foreground">
              The asset&apos;s status and condition have been updated. The information has been recorded in the asset history and audit log.
            </p>
          </div>
        </div>
        <div className="space-y-1 border-t border-success/20 pt-3 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <LifecycleValues rows={[
            ["Transaction ID", (
              <div key="id" className="flex min-w-0 items-center gap-1.5">
                <span className="min-w-0 truncate font-mono text-xs font-semibold text-foreground" title={historyId}>{historyId}</span>
                <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" aria-label="Copy Transaction ID" onClick={copyId}>
                  <CopyIcon aria-hidden="true" className="size-3.5" />
                </Button>
              </div>
            )],
            ["Confirmed On", (
              <span key="confirmed" className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <CalendarIcon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
                <time dateTime={confirmedAt}>{formatDateTime(confirmedAt)}</time>
              </span>
            )],
            ["Updated By", (
              <span key="actor" className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                <UserIcon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
                <span>{actor}</span>
              </span>
            )],
          ]} />
          {copy && <p aria-live="polite" className="text-2xs text-muted-foreground">{copy}</p>}
        </div>
      </section>
      <Card className="space-y-3 p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <InfoIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
          Update Result
        </h2>
        <ChangeStatusComparison
          beforeTitle="Previous (Before)"
          afterTitle="Updated (After)"
          rowArrows
          before={[
            ["Status", <LifecycleStatus key="status" value={before.lifecycleStatus} />],
            ["Condition", <LifecycleCondition key="condition" value={before.condition} />],
            ["Current Custodian", <LifecycleHolder key="holder" holder={before.custody} />],
            ["Location", (
              <span key="location" className="inline-flex items-center gap-1.5">
                <LocationIcon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
                <span>{beforeLocation}</span>
              </span>
            )],
            ["Reason", "—"],
            ["Notes", "—"],
          ]}
          after={[
            ["Status", <LifecycleStatus key="status" value={after.lifecycleStatus} />],
            ["Condition", <LifecycleCondition key="condition" value={after.condition} />],
            ["Current Custodian", (
              <div key="holder" className="space-y-1">
                <LifecycleHolder holder={after.custody} empty={custodyEnded ? "None — custody ends" : "—"} />
                {custodyUnchanged && (
                  <p className="flex items-center gap-1 text-2xs font-normal text-muted-foreground">
                    <InfoIcon aria-hidden="true" className="size-3 shrink-0" />
                    Custodian remains the same
                  </p>
                )}
              </div>
            )],
            ["Location", (
              <span key="location" className="inline-flex items-center gap-1.5">
                <LocationIcon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
                <span>{afterLocation}</span>
              </span>
            )],
            ["Reason", draft.reason.trim()],
            ["Notes", draft.notes.trim() || "—"],
          ]}
        />
      </Card>
      <section className="space-y-2 rounded-card border border-primary/15 bg-accent/60 p-4">
        <h2 className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <InfoIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
          Additional Information
        </h2>
        <ul className="space-y-1.5 text-xs text-foreground/90">
          {lines.map((line) => (
            <li key={line} className="flex items-start gap-2">
              <CheckCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
