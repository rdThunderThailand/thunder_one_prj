import { Card } from "@/components/ui/Card";
import { AlertCircleIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { locationTrail } from "../../domain/asset-profile";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { assignmentWriteText } from "./assignment-error-text";
import { AssignHolder } from "./AssignHolder";
import type { AssignFlow } from "./use-assign-flow";

/** Read-only check before saving. The page footer's "Confirm Assignment" saves. */
export function AssignReview({ flow, asset }: { flow: AssignFlow; asset: AssetDetail }) {
  const failed = flow.save.phase === "failed" ? flow.save : null;
  const rows = [
    { label: "Asset", value: `${asset.name} · ${asset.assetTag}` },
    { label: "Location", value: locationTrail(asset.locationPath, asset.location) || "No location" },
    { label: "Reason / Note", value: flow.reason.trim() || "—" },
  ];
  return (
    <Card className="space-y-4 p-4">
      <h2 className="text-sm font-semibold text-foreground">Review assignment</h2>
      {failed && (
        <div
          role="alert"
          tabIndex={-1}
          className="flex flex-wrap items-start gap-3 rounded-control border border-error bg-error-muted p-3 text-xs text-foreground"
        >
          <AlertCircleIcon
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-error"
          />
          <p className="min-w-0 flex-1">{assignmentWriteText(failed.code ?? "", failed.uncertain)}</p>
          {(failed.uncertain || ["STALE", "INVALID_STATE", "NOT_FOUND"].includes(failed.code ?? "")) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={flow.reload}
            >
              Reload
            </Button>
          )}
        </div>
      )}
      {flow.detail.pending && (
        <p
          role="status"
          className="rounded-control bg-muted p-3 text-xs"
        >
          Reloading asset… Your input stays.
        </p>
      )}
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
