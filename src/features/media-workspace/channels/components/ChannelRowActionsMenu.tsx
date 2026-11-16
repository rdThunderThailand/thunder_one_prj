"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { MoreIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/Modal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/lovable/popover";
import { classifyApiError } from "@/lib/api/api-error";
import { deactivateChannel } from "../services/channels-api";
import type { ChannelListItem } from "../types";

/**
 * D2's row "…" menu: Duplicate Channel, Disable Channel. Duplicate has no backend route yet
 * (ticket 07's deviation table) — rendered disabled with a tooltip, same treatment as
 * "Open Live View" (ticket 14). Disable Channel is the existing Deactivate action
 * (`ChannelLifecycleActions`), only meaningful for an `active` Channel. Spec §6.4 makes it a
 * sensitive action, so the menu item only opens a confirmation; the request waits for Disable.
 */
export function ChannelRowActionsMenu({
  channel,
  onChanged,
}: {
  channel: ChannelListItem;
  onChanged: (updated: ChannelListItem) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const canDisable = channel.lifecycle === "active";

  const disable = async () => {
    setPending(true);
    setError(null);
    try {
      onChanged(await deactivateChannel(channel.id, channel.revision));
      setIsConfirming(false);
    } catch (caught) {
      setIsConfirming(false);
      setIsOpen(true);
      setError(classifyApiError(caught, "Could not disable this Channel. Try again.").message);
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
          {error && (
            <p role="alert" className="px-3 py-2 text-xs text-error">
              {error}
            </p>
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
    </span>
  );
}
