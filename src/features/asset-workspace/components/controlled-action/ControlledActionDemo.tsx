"use client";

import { useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Checkbox } from "@/components/ui/lovable/checkbox";
import { Label } from "@/components/ui/lovable/label";
import { actionsFor } from "../../domain/asset-actions";
import { ControlledActionDialog } from "./ControlledActionDialog";
import { ACTION_LABELS, type ActionAsset, type ActionSubmission, type ControlledActionKey } from "./controlled-action";

// ponytail: Phase 1 demo with in-memory sample assets — removed in Phase 3 when the asset profile
// wires the dialog to Core.
const SAMPLE_ASSETS: ActionAsset[] = [
  { label: "LT-0001 · Laptop", status: "Available", condition: "Good", custody: null, location: "HQ 3F" },
  { label: "LT-0002 · Laptop", status: "Assigned", condition: "Fair", custody: { type: "person", id: "", label: "Somchai K." }, location: "HQ 3F" },
  { label: "PR-0003 · Printer", status: "In Maintenance", condition: "Damaged", custody: null, location: "Service room" },
  { label: "MN-0004 · Monitor", status: "Retired", condition: "Unusable", custody: null, location: "Store" },
];

export function ControlledActionDemo() {
  const [assetIndex, setAssetIndex] = useState(0);
  const [action, setAction] = useState<ControlledActionKey | null>(null);
  const [shouldFail, setShouldFail] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<ActionSubmission | null>(null);
  const asset = SAMPLE_ASSETS[assetIndex];
  const actions = actionsFor(asset.status).filter((key): key is ControlledActionKey => key !== "print_label");

  function confirm(submission: ActionSubmission) {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (shouldFail) {
          reject(new Error("demo failure"));
          return;
        }
        setLastSubmission(submission);
        resolve();
      }, 600);
    });
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">
          Controlled action demo
        </h1>
        <p className="text-sm text-muted-foreground">
          Phase 1 preview of the action dialog with sample assets. Nothing is saved.
        </p>
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Sample asset"
      >
        {SAMPLE_ASSETS.map((sample, index) => (
          <Button
            key={sample.label}
            variant={index === assetIndex ? "primary" : "outline"}
            size="sm"
            aria-pressed={index === assetIndex}
            onClick={() => setAssetIndex(index)}
          >
            {sample.label} · {sample.status}
          </Button>
        ))}
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Actions"
      >
        {actions.map((key) => (
          <Button
            key={key}
            variant="outline"
            onClick={() => setAction(key)}
          >
            {ACTION_LABELS[key]}
          </Button>
        ))}
        {actions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No actions for {asset.status} assets.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="demo-fail"
          checked={shouldFail}
          onCheckedChange={(checked) => setShouldFail(checked === true)}
        />
        <Label htmlFor="demo-fail">
          Make Confirm fail
        </Label>
      </div>

      {lastSubmission && (
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-3 text-xs text-foreground">
          {JSON.stringify(lastSubmission, null, 2)}
        </pre>
      )}

      <ControlledActionDialog
        action={action}
        asset={asset}
        onClose={() => setAction(null)}
        onConfirm={confirm}
      />
    </div>
  );
}
