import { Card } from "@/components/ui/Card";
import { locationTrail } from "../../domain/asset-profile";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { AssignHolder } from "./AssignHolder";
import { SaveAlert } from "./SaveAlert";
import type { AssignFlow } from "./use-assign-flow";

/** Read-only check before saving. The page footer's "Confirm Assignment" saves. */
export function AssignReview({ flow, asset }: { flow: AssignFlow; asset: AssetDetail }) {
  const rows = [
    { label: "Asset", value: `${asset.name} · ${asset.assetTag}` },
    { label: "Location", value: locationTrail(asset.locationPath, asset.location) || "No location" },
    { label: "Reason / Note", value: flow.reason.trim() || "—" },
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
            className="grid gap-1 py-2 sm:grid-cols-[10rem_minmax(0,1fr)]"
          >
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="text-foreground wrap-anywhere">{row.value}</dd>
          </div>
        ))}
        <div className="grid gap-1 py-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <dt className="text-muted-foreground">Assign to</dt>
          <dd>
            {flow.target && (
              <AssignHolder
                type={flow.target.type}
                name={flow.target.name}
                secondary={flow.target.secondary}
              />
            )}
          </dd>
        </div>
        <div className="grid gap-1 py-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <dt className="text-muted-foreground">Attachments</dt>
          <dd className="text-foreground wrap-anywhere">
            {flow.evidence.items.length ? flow.evidence.items.map((item) => item.file.name).join(", ") : "None"}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
