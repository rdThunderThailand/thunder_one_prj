"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { MoreIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/Modal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/lovable/popover";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { lifecycleActionsFor } from "../lifecycle-actions";
import { deactivateChannel } from "../services/channels-api";
import type { ChannelListItem } from "../types";
import { DeleteChannelDialog } from "./DeleteChannelDialog";

/**
 * D2's row "…" menu: Duplicate Channel, Disable Channel, Delete Channel. Duplicate has no backend route yet
 * (ticket 07's deviation table) — rendered disabled with a tooltip, same treatment as
 * "Open Live View" (ticket 14). Disable Channel is the existing Deactivate action
 * (`ChannelLifecycleActions`), only meaningful for an `active` Channel. Spec §6.4 makes it a
 * sensitive action, so the menu item only opens a confirmation; the request waits for Disable.
 * Delete Channel is offered for every row: the list carries no blocking Programs, so Core's refusal
 * shows inline in the dialog (ADR 0122).
 */
export function ChannelRowActionsMenu({
  channel,
  onChanged,
  onDeleted,
}: {
  channel: ChannelListItem;
  onChanged: (updated: ChannelListItem) => void;
  onDeleted: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const canDisable = lifecycleActionsFor({ lifecycle: channel.lifecycle, hasPlayer: true, blockingPrograms: [] }).canDeactivate;

  const disable = async () => {
    setPending(true);
    setError(null);
    try {
      onChanged(await deactivateChannel(channel.id, channel.revision));
      setIsConfirming(false);
    } catch (caught) {
      setIsConfirming(false);
      setIsOpen(true);
      setError(classifyApiError(caught, "ปิดใช้งาน Channel นี้ไม่สำเร็จ กรุณาลองใหม่"));
    } finally {
      setPending(false);
    }
  };

  // QA 2026-10-08 #10: a portalled Popover (not a Radix menu — it stays open to show an error),
  // so the table's overflow cannot clip it. The span keeps clicks off the row.
  return (
    <span onClick={(event) => event.stopPropagation()}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          aria-label={`More actions for ${channel.name}`}
          aria-haspopup="menu"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <MoreIcon />
        </PopoverTrigger>
        <PopoverContent
          role="menu"
          align="end"
          className="w-48 p-0 py-1"
        >
          <button
            type="button"
            role="menuitem"
            disabled
            title="Duplicate Channel — not available yet"
            className="w-full px-3 py-2 text-left text-sm text-muted-foreground disabled:cursor-not-allowed"
          >
            Duplicate Channel
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!canDisable || pending}
            title={canDisable ? undefined : "Channel is not active"}
            onClick={() => {
              setError(null);
              setIsOpen(false);
              setIsConfirming(true);
            }}
            className="w-full px-3 py-2 text-left text-sm text-error hover:bg-error-muted disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent"
          >
            Disable Channel
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={pending}
            onClick={() => {
              setError(null);
              setIsOpen(false);
              setIsConfirmingDelete(true);
            }}
            className="w-full px-3 py-2 text-left text-sm text-error hover:bg-error-muted disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent"
          >
            Delete Channel
          </button>
          {error && (
            <p role="alert" className="px-3 py-2 text-xs text-error">
              {error.message}
            </p>
          )}
          {/* No room for a list here: the editor already links each blocking Program (ADR 0130 §4). */}
          {error?.reason === "in-use" && (
            <Link
              href={`/media-workspace/channels/${channel.id}/edit`}
              target="_blank"
              rel="noreferrer"
              role="menuitem"
              className="block px-3 pb-2 text-xs font-medium text-primary underline"
            >
              เปิด Channel
            </Link>
          )}
        </PopoverContent>
      </Popover>
      <Modal
        open={isConfirming}
        onClose={() => setIsConfirming(false)}
        title={`Disable ${channel.name}?`}
        footer={
          <>
            <Button type="button" variant="secondary" disabled={pending} onClick={() => setIsConfirming(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={pending} onClick={() => void disable()}>
              {pending ? "Disabling…" : "Disable"}
            </Button>
          </>
        }
      >
        <p>The Channel stops reserving its devices. It is refused while a live Program still targets it.</p>
      </Modal>
      <DeleteChannelDialog
        open={isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
        channelId={channel.id}
        channelName={channel.name}
        playerName={channel.player?.name ?? null}
        revision={channel.revision}
        onDeleted={() => onDeleted(channel.id)}
      />
    </span>
  );
}
