import Link from "next/link";
import type { RefObject } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Textarea } from "@/components/ui/lovable/textarea";
import { Card } from "@/components/ui/Card";
import type { useAssetEdit } from "../../hooks/use-asset-edit";
import { RegistrationField } from "../register-asset/RegistrationFields";

type Flow = ReturnType<typeof useAssetEdit>;

export function AssetEditFeedback({ flow, feedback }: { flow: Flow; feedback: RefObject<HTMLDivElement | null> }) {
  const errors = Object.values(flow.fields).filter(Boolean);
  if (!flow.failure && !errors.length && !flow.reloadError && flow.asset.lifecycleStatus !== "Disposed") return null;
  return (
    <div ref={feedback} role="alert" tabIndex={-1} className="space-y-2 rounded-control border border-error/30 bg-error-muted p-4 text-xs focus-visible:outline-2 focus-visible:outline-ring">
      <p>{flow.failure?.message ?? (flow.asset.lifecycleStatus === "Disposed" ? "Disposed assets can't be edited." : "Review the highlighted fields.")}</p>
      {errors.map((message, index) => <p key={index}>{message}</p>)}
      {flow.reloadError && <p>{flow.reloadError}</p>}
      {flow.failure?.code === "STALE" && (
        <Button variant="outline" size="sm" disabled={flow.reloading} onClick={() => void flow.reload()}>Reload and replace form</Button>
      )}
      {flow.failure?.uncertain && (
        <Button asChild variant="outline" size="sm">
          <a href={`/asset-workspace/assets/${encodeURIComponent(flow.asset.id)}`} target="_blank" rel="noopener noreferrer">Open latest profile</a>
        </Button>
      )}
      {flow.failure?.code === "UNAUTHENTICATED" && (
        <Button asChild variant="outline" size="sm">
          <Link href="/login">Sign in</Link>
        </Button>
      )}
    </div>
  );
}

export function AssetEditDuplicate({ flow }: { flow: Flow }) {
  if (!flow.requiresReason) return null;
  return (
    <Card role="region" aria-labelledby="asset-edit-serial-warning" className="space-y-3 p-4 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none">
      <h2 id="asset-edit-serial-warning" className="text-sm font-semibold">Duplicate serial number</h2>
      <p className="text-xs text-muted-foreground">Review the matching assets. A reason is required to keep this serial number and will be recorded in History.</p>
      <ul className="space-y-2 text-xs">
        {flow.failure?.duplicates.map((asset) => (
          <li key={asset.id}>
            <a href={`/asset-workspace/assets/${encodeURIComponent(asset.id)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center rounded-control text-accent-foreground underline underline-offset-4 wrap-anywhere focus-visible:outline-2 focus-visible:outline-ring">{asset.assetTag} · {asset.name || "Unnamed asset"}</a>
          </li>
        ))}
      </ul>
      <RegistrationField name="asset-edit-override" label="Reason for duplicate serial" required error={flow.fields.serialOverrideReason}>
        <Textarea
          id="registration-asset-edit-override" rows={3} value={flow.reason} disabled={flow.locked} aria-required="true"
          aria-invalid={Boolean(flow.fields.serialOverrideReason)}
          aria-describedby={flow.fields.serialOverrideReason ? "registration-asset-edit-override-error" : undefined}
          onChange={(event) => flow.setReason(event.target.value)}
        />
      </RegistrationField>
    </Card>
  );
}
