"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { deleteRefusalMessage } from "../delete-refusal";
import { deleteChannel } from "../services/channels-api";

/**
 * The delete confirmation shared by the Lifecycle card and the list row menu (ADR 0122 rule 5,
 * ADR 0123). A refusal stays inline and keeps the dialog open; success toasts, closes, then calls
 * `onDeleted` so the caller can leave the page or drop the row.
 */
export function DeleteChannelDialog({
  open,
  onClose,
  channelId,
  channelName,
  playerName,
  revision,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  channelId: string;
  channelName: string;
  playerName: string | null;
  revision: number;
  onDeleted: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setError(null);
    onClose();
  };

  const confirm = async () => {
    setPending(true);
    setError(null);
    try {
      await deleteChannel(channelId, revision);
      toast.success(playerName ? `Channel deleted — ${playerName} is free` : "Channel deleted");
      close();
      onDeleted();
    } catch (caught) {
      setError(deleteRefusalMessage(caught, "Could not delete this Channel. Try again."));
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Delete "${channelName}"?`}
      footer={
        <>
          <Button type="button" variant="outline" disabled={pending} onClick={close}>
            Cancel
          </Button>
          <Button type="button" disabled={pending} onClick={() => void confirm()}>
            {pending ? "Deleting…" : "Delete Channel"}
          </Button>
        </>
      }
    >
      {playerName && <p>{playerName} becomes available for another Channel.</p>}
      <p>This can&apos;t be undone.</p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-error">
          {error}
        </p>
      )}
    </Modal>
  );
}
