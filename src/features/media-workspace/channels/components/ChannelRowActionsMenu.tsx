"use client";

import { useState } from "react";
import { MoreIcon } from "@/components/ui/icons";
import { classifyApiError } from "@/lib/api/api-error";
import { deactivateChannel } from "../services/channels-api";
import type { ChannelListItem } from "../types";

/**
 * D2's row "…" menu: Duplicate Channel, Disable Channel. Duplicate has no backend route yet
 * (ticket 07's deviation table) — rendered disabled with a tooltip, same treatment as
 * "Open Live View" (ticket 14). Disable Channel is the existing Deactivate action
 * (`ChannelLifecycleActions`), only meaningful for an `active` Channel.
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

  const canDisable = channel.lifecycle === "active";

  const disable = async () => {
    setPending(true);
    setError(null);
    try {
      onChanged(await deactivateChannel(channel.id, channel.revision));
      setIsOpen(false);
    } catch (caught) {
      setError(classifyApiError(caught, "Could not disable this Channel. Try again.").message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="relative inline-block" onKeyDown={(event) => event.key === "Escape" && setIsOpen(false)}>
      <button
        type="button"
        aria-label={`More actions for ${channel.name}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((open) => !open);
        }}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        <MoreIcon />
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={(event) => {
              event.stopPropagation();
              setIsOpen(false);
            }}
          />
          <div
            role="menu"
            onClick={(event) => event.stopPropagation()}
            className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-border bg-card py-1 shadow-lg"
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
              onClick={() => void disable()}
              className="w-full px-3 py-2 text-left text-sm text-danger hover:bg-danger-soft disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent"
            >
              {pending ? "Disabling…" : "Disable Channel"}
            </button>
            {error && (
              <p role="alert" className="px-3 py-2 text-xs text-danger">
                {error}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
