"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PlusIcon, TrashIcon } from "@/components/ui/icons";
import {
  formatChannelLastSeen,
  getDeviceCompatibility,
  type DeviceCompatibility,
} from "../channel-logic";
import type { ChannelDeviceCandidate, ChannelOrientation } from "../types";
import { ChannelDevicePickerModal } from "./ChannelDevicePickerModal";

export function CompatibilityNote({
  compatibility,
  confirmed,
  deviceName,
  onConfirm,
}: {
  compatibility: DeviceCompatibility;
  confirmed: boolean;
  deviceName: string;
  onConfirm: (confirmed: boolean) => void;
}) {
  if (compatibility === "orientation-mismatch") {
    return (
      <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
        Orientation mismatch — this device cannot be selected.
      </p>
    );
  }
  if (compatibility === "resolution-mismatch") {
    return (
      <label className="mt-2 flex max-w-sm items-start gap-2 text-xs font-medium text-amber-700 dark:text-amber-400">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => onConfirm(event.target.checked)}
          className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
        />
        Confirm resolution mismatch for {deviceName} before assigning the device.
      </label>
    );
  }
  if (compatibility === "profile-unavailable") {
    return (
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Display profile partially unavailable — only known values were checked.
      </p>
    );
  }
  if (compatibility === "compatible") {
    return <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">Matches expectation</p>;
  }
  return <p className="mt-1 text-xs text-zinc-400">No display expectation to check</p>;
}

export function ChannelDeviceAssignmentSection({
  id,
  alert,
  devices,
  selectedIds,
  expectedOrientation,
  expectedResolution,
  resolutionConfirmations,
  onToggle,
  onConfirmResolution,
}: {
  id?: string;
  alert?: boolean;
  devices: ChannelDeviceCandidate[];
  selectedIds: string[];
  expectedOrientation: ChannelOrientation | null;
  expectedResolution: string | null;
  resolutionConfirmations: ReadonlySet<string>;
  onToggle: (deviceId: string) => void;
  onConfirmResolution: (deviceId: string, confirmed: boolean) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const assigned = devices.filter((device) => selectedIds.includes(device.id));
  const unassigned = devices.filter((device) => !selectedIds.includes(device.id));

  return (
    <Card id={id} tabIndex={id ? -1 : undefined} className={`overflow-hidden ${alert ? "flash-outline" : ""}`}>
      <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white">
            2
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
              Physical delivery
            </p>
            <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                  Device / Endpoint Assignment
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Assign one device or a device group that will receive the same media and schedule.
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={() => setPickerOpen(true)}>
                <PlusIcon />
                Add Existing Device
              </Button>
            </div>
          </div>
        </div>
      </div>

      {alert && (
        <p role="alert" className="border-b border-red-100 bg-red-50/70 px-5 py-2.5 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-500/10 dark:text-red-400">
          Add at least one device before activating this Channel.
        </p>
      )}

      {assigned.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            No devices assigned
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Use Add Existing Device to assign one or more Physical Devices to this Channel.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400">
                <th className="w-10 px-5 py-2.5">#</th>
                <th className="px-3 py-2.5">Device</th>
                <th className="px-3 py-2.5">Orientation · Resolution</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="w-16 px-5 py-2.5 text-right">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {assigned.map((device, index) => {
                const compatibility = getDeviceCompatibility(
                  device,
                  expectedOrientation,
                  expectedResolution,
                );
                const confirmed = resolutionConfirmations.has(device.id);

                return (
                  <tr key={device.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                    <td className="px-5 py-4 align-top text-xs tabular-nums text-zinc-400">
                      {index + 1}
                    </td>
                    <td className="px-3 py-4 align-top">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{device.name}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-zinc-400">
                        {device.code ?? "Code unavailable"}
                      </p>
                      <CompatibilityNote
                        compatibility={compatibility}
                        confirmed={confirmed}
                        deviceName={device.name}
                        onConfirm={(next) => onConfirmResolution(device.id, next)}
                      />
                    </td>
                    <td className="px-3 py-4 align-top text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {device.orientation ?? "unavailable"} · {device.resolution ?? "unavailable"}
                    </td>
                    <td className="px-3 py-4 align-top">
                      <Badge
                        color={device.health === "online" ? "green" : device.health === "warning" ? "yellow" : "red"}
                      >
                        {device.health[0].toUpperCase() + device.health.slice(1)}
                      </Badge>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {formatChannelLastSeen(device.last_heartbeat_at)}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-right align-top">
                      <button
                        type="button"
                        aria-label={`Remove ${device.name}`}
                        onClick={() => onToggle(device.id)}
                        className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ChannelDevicePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        candidates={unassigned}
        expectedOrientation={expectedOrientation}
        expectedResolution={expectedResolution}
        resolutionConfirmations={resolutionConfirmations}
        onConfirmResolution={onConfirmResolution}
        onAdd={onToggle}
      />
    </Card>
  );
}
