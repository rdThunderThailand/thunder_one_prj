"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { toast } from "sonner";
import { lifecycleActionsFor } from "../lifecycle-actions";
import { activateChannel, deactivateChannel } from "../services/channels-api";
import type { BlockingProgram, ChannelDetail, ChannelLifecycle } from "../types";
import { DeleteChannelDialog } from "./DeleteChannelDialog";

/**
 * Activate / Deactivate / Delete for an existing Channel. Split out of ChannelEditorPage (already at
 * the file-size limit) and only rendered in edit mode.
 *
 * Actions follow the STORED status (ADR 0122 rule 3): Deactivate releases the Channel's device
 * reservations and is refused while a live Publication needs them; Activate needs a Player; Delete
 * (any status) is refused by Core once the Channel was ever used. Programs that are live or scheduled
 * disable Deactivate and Delete up front (`blockingPrograms`).
 */
export function ChannelLifecycleActions({
  channelId,
  channelName,
  status,
  playerName,
  blockingPrograms,
  revision,
  onChanged,
  onDeleted,
}: {
  channelId: string;
  channelName: string;
  status: ChannelLifecycle;
  playerName: string | null;
  blockingPrograms: BlockingProgram[];
  revision: number;
  onChanged: (detail: ChannelDetail) => void;
  onDeleted: () => void;
}) {
  const [pending, setPending] = useState<"activate" | "deactivate" | null>(null);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isConfirmingDeactivate, setIsConfirmingDeactivate] = useState(false);

  const activate = async () => {
    setPending("activate");
    setError(null);
    try {
      onChanged(await activateChannel(channelId, revision));
      toast.success("Channel activated");
    } catch (caught) {
      setError(classifyApiError(caught, "เปิดใช้งาน Channel นี้ไม่สำเร็จ กรุณาลองใหม่"));
    } finally {
      setPending(null);
    }
  };

  const deactivate = async () => {
    setPending("deactivate");
    setError(null);
    try {
      onChanged(await deactivateChannel(channelId, revision));
      setIsConfirmingDeactivate(false);
      toast.success(playerName ? `Channel deactivated — ${playerName} is free` : "Channel deactivated");
    } catch (caught) {
      setIsConfirmingDeactivate(false);
      setError(classifyApiError(caught, "ปิดใช้งาน Channel นี้ไม่สำเร็จ กรุณาลองใหม่"));
    } finally {
      setPending(null);
    }
  };

  const busy = pending !== null;
  const actions = lifecycleActionsFor({ status, hasPlayer: playerName !== null, blockingPrograms });

  return (
    <Card className="p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Lifecycle</p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-error">
          {error.message}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {status === "active" && (
          <Button
            type="button"
            variant="outline"
            disabled={busy || !actions.canDeactivate}
            title={actions.blockedReason ?? undefined}
            onClick={() => setIsConfirmingDeactivate(true)}
          >
            Deactivate
          </Button>
        )}
        {status !== "active" && (
          <Button
            type="button"
            disabled={busy || !actions.canActivate}
            title={actions.activateBlockedReason ?? undefined}
            onClick={() => void activate()}
          >
            {pending === "activate" ? "Activating…" : "Activate"}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={busy || !actions.canDelete}
          title={actions.blockedReason ?? undefined}
          onClick={() => setConfirmingDelete(true)}
          className="text-error hover:bg-error-muted"
        >
          Delete Channel
        </Button>
      </div>

      {/* Spec §6.4: Disable/Deactivate is a sensitive action and needs a confirmation. */}
      <Modal
        open={isConfirmingDeactivate}
        onClose={() => setIsConfirmingDeactivate(false)}
        title="Deactivate this Channel?"
        footer={
          <>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setIsConfirmingDeactivate(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={() => void deactivate()}>
              {pending === "deactivate" ? "Deactivating…" : "Deactivate"}
            </Button>
          </>
        }
      >
        <p>The Channel stops reserving its devices. It is refused while a live Program still targets it.</p>
      </Modal>

      <DeleteChannelDialog
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        channelId={channelId}
        channelName={channelName}
        playerName={playerName}
        revision={revision}
        onDeleted={onDeleted}
      />
    </Card>
  );
}
