"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getDeviceCompatibility } from "../channel-logic";
import type { ChannelDeviceCandidate, ChannelOrientation } from "../types";
import { CompatibilityNote } from "./ChannelDeviceAssignmentSection";

/** Lists unassigned Physical Devices for the Channel editor to add. Compatibility gating
 * (orientation blocks, resolution requires confirmation) is unchanged from the inline table
 * this replaced — only where the user picks a device moved. */
export function ChannelDevicePickerModal({
  open,
  onClose,
  candidates,
  expectedOrientation,
  expectedResolution,
  resolutionConfirmations,
  onConfirmResolution,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  candidates: ChannelDeviceCandidate[];
  expectedOrientation: ChannelOrientation | null;
  expectedResolution: string | null;
  resolutionConfirmations: ReadonlySet<string>;
  onConfirmResolution: (deviceId: string, confirmed: boolean) => void;
  onAdd: (deviceId: string) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return candidates;
    return candidates.filter((device) => device.name.toLowerCase().includes(query));
  }, [candidates, search]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Existing Device"
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search devices…"
        className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />

      <div className="-mx-1 mt-1 max-h-80 space-y-1 overflow-y-auto px-1">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">
            {candidates.length === 0 ? "All Physical Devices are already assigned." : "No devices match this search."}
          </p>
        ) : (
          filtered.map((device) => {
            const compatibility = getDeviceCompatibility(device, expectedOrientation, expectedResolution);
            const confirmed = resolutionConfirmations.has(device.id);
            const blocked =
              compatibility === "orientation-mismatch" ||
              (compatibility === "resolution-mismatch" && !confirmed);

            return (
              <div
                key={device.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-zinc-100 px-3 py-2.5 dark:border-zinc-800"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">{device.name}</p>
                    <Badge
                      color={device.health === "online" ? "green" : device.health === "warning" ? "yellow" : "red"}
                    >
                      {device.health[0].toUpperCase() + device.health.slice(1)}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {device.orientation ?? "unavailable"} · {device.resolution ?? "unavailable"}
                  </p>
                  <CompatibilityNote
                    compatibility={compatibility}
                    confirmed={confirmed}
                    deviceName={device.name}
                    onConfirm={(next) => onConfirmResolution(device.id, next)}
                  />
                </div>
                <Button type="button" disabled={blocked} onClick={() => onAdd(device.id)}>
                  Add
                </Button>
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
}
