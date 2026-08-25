"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { deactivateChannel, deleteDraftChannel } from "../services/channels-api";
import type { ChannelDetail, ChannelLifecycle } from "../types";

/**
 * Deactivate / Delete for an existing Channel. Split out of ChannelEditorPage (already at the
 * file-size limit) and only rendered in edit mode.
 *
 * There is no Activate here by design (ADR 0037): a Channel is committed by the Create button and
 * reads Active only while a Publication targets it. Deactivate remains the operator's way to
 * release the Channel's device reservations, and is refused while a live Publication needs them.
 */
export function ChannelLifecycleActions({
  channelId,
  lifecycle,
  revision,
  onChanged,
  onDeleted,
}: {
  channelId: string;
  lifecycle: ChannelLifecycle;
  revision: number;
  onChanged: (detail: ChannelDetail) => void;
  onDeleted: () => void;
}) {
  const [pending, setPending] = useState<"deactivate" | "delete" | null>(null);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const deactivate = async () => {
    setPending("deactivate");
    setError(null);
    try {
      onChanged(await deactivateChannel(channelId, revision));
    } catch (caught) {
      setError(classifyApiError(caught, "Could not deactivate this Channel. Try again."));
    } finally {
      setPending(null);
    }
  };

  const confirmDelete = async () => {
    setPending("delete");
    setError(null);
    try {
      await deleteDraftChannel(channelId, revision);
      setConfirmingDelete(false);
      onDeleted();
    } catch (caught) {
      setConfirmingDelete(false);
      setError(classifyApiError(caught, "Could not delete this Channel. Try again."));
    } finally {
      setPending(null);
    }
  };

  const busy = pending !== null;
  // ADR 0037 derives `inactive` for a committed Channel that nothing publishes to, and neither
  // action applies to it — without this the card renders as an empty box under the summary, which
  // reads as a missing Delete button rather than as "there is nothing to do here".
  if (lifecycle === "inactive") return null;

  return (
    <Card className="p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Lifecycle</p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error.message}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {lifecycle === "active" && (
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void deactivate()}>
            {pending === "deactivate" ? "Deactivating…" : "Deactivate"}
          </Button>
        )}
        {lifecycle === "draft" && (
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => setConfirmingDelete(true)}
            className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            Delete Channel
          </Button>
        )}
      </div>

      <Modal
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title="Delete this Channel?"
        footer={
          <>
            <Button type="button" variant="secondary" disabled={busy} onClick={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={() => void confirmDelete()}>
              {pending === "delete" ? "Deleting…" : "Delete"}
            </Button>
          </>
        }
      >
        <p>This cannot be undone. A Channel that has ever been active cannot be deleted.</p>
      </Modal>
    </Card>
  );
}
