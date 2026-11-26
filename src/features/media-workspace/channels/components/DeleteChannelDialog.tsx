"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { IN_USE_LEAD, programLinks } from "../../in-use/in-use-links";
import { InUseRefusal } from "../../in-use/InUseRefusal";
import { deleteChannel, fetchChannel } from "../services/channels-api";
import { deleteDialogLines, deleteSuccessMessage } from "../delete-dialog-copy";
import type { ChannelDetail } from "../types";

/**
 * The delete confirmation shared by the Lifecycle card and the list row menu (ADR 0122 rule 5,
 * ADR 0123). A refusal stays inline and keeps the dialog open; success toasts, closes, then calls
 * `onDeleted` so the caller can leave the page or drop the row. It reads the Channel's detail when it
 * opens, so the row menu (which has none) can still say whether Delete will keep a Tombstone (rule 20).
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
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [detail, setDetail] = useState<ChannelDetail | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    void fetchChannel(channelId)
      .then((loaded) => {
        if (alive) setDetail(loaded);
      })
      .catch(() => {
        // Advisory only: Core decides the mode on Delete, so a failed read keeps the no-history text.
      });
    return () => {
      alive = false;
    };
  }, [open, channelId]);

  const close = () => {
    setError(null);
    setDetail(null);
    onClose();
  };

  const confirm = async () => {
    setPending(true);
    setError(null);
    try {
      const { mode } = await deleteChannel(channelId, revision);
      toast.success(deleteSuccessMessage(mode, playerName));
      close();
      onDeleted();
    } catch (caught) {
      setError(classifyApiError(caught, "ลบ Channel นี้ไม่สำเร็จ กรุณาลองใหม่"));
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
      {deleteDialogLines(detail, playerName).map((line) => (
        <p key={line}>{line}</p>
      ))}
      <p>This can&apos;t be undone.</p>
      {error &&
        (error.reason === "in-use" ? (
          <InUseRefusal
            message={error.message}
            lead={IN_USE_LEAD.channel}
            load={() => fetchChannel(channelId).then((d) => programLinks(d.blocking_programs))}
            className="mt-3 text-sm text-error"
          />
        ) : (
          <p role="alert" className="mt-3 text-sm text-error">
            {error.message}
          </p>
        ))}
    </Modal>
  );
}
