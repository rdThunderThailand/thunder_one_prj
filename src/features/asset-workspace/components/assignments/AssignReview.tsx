import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/lovable/button";
import { locationTrail } from "../../domain/asset-profile";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { AssetThumbnail } from "../AssetThumbnail";
import { AssignHolder } from "./AssignHolder";
import { SaveAlert } from "./SaveAlert";
import type { AssignFlow } from "./use-assign-flow";

/** Read-only check before saving. The page footer's "Confirm Assignment" saves; "Change" jumps back to the step that set a value. */
export function AssignReview({ flow, asset }: { flow: AssignFlow; asset: AssetDetail }) {
  const sending = flow.save.phase === "sending";
  const change = (step: string, label: string) => {
    const index = flow.steps.indexOf(step);
    if (index < 0) return null;
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={`Change ${label}`}
        disabled={sending}
        onClick={() => flow.setStep(index)}
      >
        Change
      </Button>
    );
  };
  const rows: { label: string; value: ReactNode; action?: ReactNode }[] = [
    {
      label: "Asset",
      value: (
        <div className="flex min-w-0 items-center gap-2">
          <AssetThumbnail
            src={flow.picked?.thumbnailUrl ?? flow.photo}
            className="size-10"
          />
          <span className="min-w-0 wrap-anywhere">{`${asset.name} · ${asset.assetTag}`}</span>
        </div>
      ),
      action: change("Select Asset", "asset"),
    },
    { label: "Location", value: locationTrail(asset.locationPath, asset.location) || "No location" },
    {
      label: "Assign to",
      value: flow.target && (
        <AssignHolder
          type={flow.target.type}
          name={flow.target.name}
          secondary={flow.target.secondary}
        />
      ),
      action: change("Assign Details", "custodian"),
    },
    { label: "Reason / Note", value: flow.reason.trim() || "—", action: change("Assign Details", "reason") },
    {
      label: "Attachments",
      value: flow.evidence.items.length ? flow.evidence.items.map((item) => item.file.name).join(", ") : "None",
      action: change("Assign Details", "attachments"),
    },
  ];
  return (
    <Card className="space-y-4 p-4">
      <h2 className="text-sm font-semibold text-foreground">Review assignment</h2>
      <SaveAlert
        save={flow.save}
        action="assign"
        reloading={flow.detail.pending}
        onReload={flow.reload}
      />
      <dl className="divide-y divide-border text-xs">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid items-center gap-1 py-2 sm:grid-cols-[10rem_minmax(0,1fr)_auto]"
          >
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="min-w-0 text-foreground wrap-anywhere">{row.value}</dd>
            <dd className="justify-self-start sm:justify-self-end">{row.action}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
