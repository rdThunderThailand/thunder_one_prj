"use client";

import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/lovable/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/lovable/dialog";
import { Textarea } from "@/components/ui/lovable/textarea";
import { ASSIGN_REASON_MAX } from "../../domain/assignment-assign";
import {
  canMoveAsset, moveLocationBody, moveLocationErrors, moveLocationFailureText, moveLocationNeedsReload,
} from "../../domain/assignment-move-location";
import { locationTrail } from "../../domain/asset-profile";
import { useProfileRead } from "../../hooks/use-asset-profile";
import { moveAssetLocation, type AssignResult } from "../../services/asset-assignments-write";
import { getAssetDetail, type ProfileReadResult } from "../../services/asset-profile-api";
import type { AssetDetail } from "../../services/asset-profile-contract";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { fetchRegistrationReferences } from "../../services/registration-selector-client";
import { referenceLabel, type ReferenceItem } from "../../services/registration-selector-contract";
import { RegistrationTreeField } from "../register-asset/RegistrationTreeField";
import { getAssignOptions } from "./use-assign-flow";

type Failure = Extract<AssignResult, { ok: false }>;
type MoveForm = { asset: AssetDetail; rules: RegistrationOptions["referenceSelectors"]; unavailableId?: string };
const blocked = "Only Available, Assigned or In Maintenance assets can be moved.";

export function MoveLocationFlow({ context, assetId, onSaved, onClose, restoreFocus }: {
  context: string;
  assetId: string;
  onSaved: (asset: AssetDetail) => void;
  onClose: (refresh: boolean) => void;
  restoreFocus: () => void;
}) {
  const [destination, setDestination] = useState<ReferenceItem | null>(null);
  const [reason, setReason] = useState("");
  const [failure, setFailure] = useState<Failure | null>(null);
  const [checkId, setCheckId] = useState<string | null>(null);
  const [refreshOnClose, setRefreshOnClose] = useState(false);
  const [sending, setSending] = useState(false);
  const submitting = useRef(false);

  const form = useProfileRead<MoveForm>(`${context}:${assetId}:move-location`, async (signal) => {
    const [detail, options] = await Promise.all([getAssetDetail(context, assetId, signal), getAssignOptions(context, signal)]);
    if (!detail.ok) return detail;
    if (!options.ok) return options;
    const data: MoveForm = { asset: detail.data, rules: options.data.referenceSelectors };
    if (checkId && canMoveAsset(data.asset) && !moveLocationErrors(data.asset, checkId, "").locationId) {
      const available = await checkDestination(context, checkId, signal);
      if (!available.ok) return available;
      if (!available.data) data.unavailableId = checkId;
    }
    return { ok: true, data };
  });

  const current = form.result?.ok ? form.result.data : null;
  const allowed = current && canMoveAsset(current.asset);
  const errors = current ? moveLocationErrors(current.asset, destination?.id ?? null, reason) : null;
  const inactive = Boolean(destination && checkId === destination.id && current?.unavailableId === destination.id);
  const destinationError = inactive ? "Choose an active location." : destination ? errors?.locationId : undefined;
  const mustReload = Boolean(failure && moveLocationNeedsReload(failure));
  const accessBlocked = failure?.code === "PERMISSION_DENIED" || failure?.code === "UNAUTHENTICATED";
  const locked = sending || form.pending || mustReload || accessBlocked;
  const canSubmit = Boolean(current && allowed && destination && !destinationError && !errors?.reason && !locked);

  function reload() {
    if (submitting.current || form.pending) return;
    setCheckId(destination?.id ?? null);
    setFailure(null);
    setRefreshOnClose(true);
    form.reload();
  }

  function close() {
    if (!submitting.current) onClose(refreshOnClose || mustReload);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !canSubmit || !current || !destination) return;
    submitting.current = true;
    setSending(true);
    setFailure(null);
    const body = moveLocationBody(current.asset.updatedAt, destination.id, reason);
    const result = await moveAssetLocation(context, assetId, body, new AbortController().signal);
    submitting.current = false;
    setSending(false);
    if (result.ok) {
      toast.success("Location updated");
      onSaved(result.data);
    } else {
      setFailure(result);
    }
  }

  const waiting = !form.result || form.pending;
  return (
    <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="flex max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-card bg-card p-0 sm:max-w-lg [&>button]:size-8 motion-reduce:animate-none"
        onEscapeKeyDown={(event) => { if (submitting.current) event.preventDefault(); }}
        onPointerDownOutside={(event) => { if (submitting.current) event.preventDefault(); }}
        onCloseAutoFocus={(event) => { event.preventDefault(); requestAnimationFrame(restoreFocus); }}>
        <DialogHeader className="shrink-0 border-b border-border p-4 pr-12 text-left">
          <DialogTitle>Move Location</DialogTitle>
          <DialogDescription>Choose a new location for this asset.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-col" aria-busy={waiting || sending}>
          <div className="min-h-0 space-y-3 overflow-y-auto overscroll-contain p-4">
            <p role="note" className="flex flex-wrap items-center gap-2 rounded-control bg-muted p-3 text-xs text-muted-foreground">
              <Badge color="yellow" variant="pill">Needs attention</Badge>
              <span>PO hasn&apos;t approved or provided a design for this flow. The current UI is a mock-up.</span>
            </p>
            {failure && (
              <div role="alert" className="flex flex-wrap items-center gap-2 rounded-control border border-error bg-error-muted p-3 text-xs">
                <p className="min-w-0 flex-1">{moveLocationFailureText(failure)}</p>
                {mustReload && <Button size="sm" variant="outline" onClick={reload}>Reload</Button>}
              </div>
            )}
            {waiting ? (
              <div role="status" aria-label="Loading asset and locations…" className="space-y-3 motion-reduce:[&_*]:animate-none">
                <div aria-hidden="true" className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            ) : !current ? (
              <MoveReadError code={form.result?.ok === false ? form.result.code : undefined} retry={reload} />
            ) : !allowed ? (
              <div role="alert" className="space-y-1 rounded-control bg-warning-muted p-3 text-xs">
                <p className="font-semibold">This asset can&apos;t be moved.</p>
                <p>{blocked}</p>
              </div>
            ) : (
              <fieldset disabled={locked} className="min-w-0 space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium">From Location (Current)</p>
                  <p className="min-h-10 rounded-control border border-border bg-muted px-3 py-2 text-xs text-muted-foreground wrap-anywhere">
                    {locationTrail(current.asset.locationPath, current.asset.location) || "No location assigned."}
                  </p>
                </div>
                <RegistrationTreeField name="move-location" label="To Location" kind="locations" context={context}
                  rules={current.rules} value={destination?.id ?? ""}
                  selectedLabel={destination ? referenceLabel(destination, "locations") : ""}
                  error={destinationError} onChange={(value) => {
                    if (locked || submitting.current) return;
                    setDestination(value);
                    setCheckId(null);
                    setFailure(null);
                  }} />
                <div className="space-y-1">
                  <label htmlFor="move-location-reason" className="text-xs font-medium">Reason / Note (optional)</label>
                  <Textarea id="move-location-reason" value={reason} rows={3} maxLength={ASSIGN_REASON_MAX}
                    aria-describedby="move-location-reason-count" onChange={(event) => {
                      setReason(event.target.value);
                      setFailure(null);
                    }} />
                  <p id="move-location-reason-count" className="text-right text-2xs text-muted-foreground">
                    {reason.length}/{ASSIGN_REASON_MAX}
                  </p>
                </div>
              </fieldset>
            )}
            {sending && <p role="status" className="text-xs text-muted-foreground">Moving asset…</p>}
          </div>
          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border p-4">
            <Button variant="outline" size="sm" disabled={sending} onClick={close}>Cancel</Button>
            <Button type="submit" size="sm" disabled={!canSubmit}>{sending ? "Moving asset…" : "Move"}</Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MoveReadError({ code, retry }: { code?: string; retry: () => void }) {
  const access = code === "PERMISSION_DENIED" || code === "UNAUTHENTICATED";
  const message = access || code === "NOT_FOUND" ? moveLocationFailureText({ code, uncertain: false }) : "Couldn't load the asset or locations.";
  return (
    <div role="alert" className="flex flex-wrap items-center gap-2 rounded-control border border-error bg-error-muted p-3 text-xs">
      <p className="min-w-0 flex-1">{message}</p>
      {!access && <Button size="sm" variant="outline" onClick={retry}>Retry</Button>}
    </div>
  );
}

async function checkDestination(context: string, id: string, signal: AbortSignal): Promise<ProfileReadResult<boolean>> {
  try {
    const result = await fetchRegistrationReferences(context, { kind: "locations", id }, signal);
    return { ok: true, data: result.items.some((item) => item.id === id.toLowerCase()) };
  } catch (error) {
    if (signal.aborted) throw error;
    const code = error && typeof error === "object" && "code" in error && typeof error.code === "string"
      ? error.code : "UNREACHABLE";
    return code === "NOT_FOUND" ? { ok: true, data: false } : { ok: false, status: 0, code, message: "" };
  }
}
