"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  formatChannelLastSeen,
  getDeviceCompatibility,
  type DeviceCompatibility,
} from "../channel-logic";
import type { ChannelDeviceCandidate, ChannelOrientation } from "../types";

function CompatibilityNote({
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
  devices,
  selectedIds,
  expectedOrientation,
  expectedResolution,
  resolutionConfirmations,
  onToggle,
  onConfirmResolution,
}: {
  devices: ChannelDeviceCandidate[];
  selectedIds: string[];
  expectedOrientation: ChannelOrientation | null;
  expectedResolution: string | null;
  resolutionConfirmations: ReadonlySet<string>;
  onToggle: (deviceId: string) => void;
  onConfirmResolution: (deviceId: string, confirmed: boolean) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white">
            2
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
              Physical delivery
            </p>
            <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                  Device / Endpoint Assignment
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Select existing Physical Devices for this Channel.
                </p>
              </div>
              <span className="text-xs font-semibold tabular-nums text-zinc-500 dark:text-zinc-400">
                {selectedIds.length} selected
              </span>
            </div>
          </div>
        </div>
      </div>

      {devices.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            No Physical Devices available
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Devices appear here after they are available in Media Workspace.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400">
                <th className="w-14 px-5 py-2.5"><span className="sr-only">Select</span></th>
                <th className="px-3 py-2.5">Physical Device</th>
                <th className="px-3 py-2.5">Health</th>
                <th className="px-3 py-2.5">Last seen</th>
                <th className="px-5 py-2.5">Display compatibility</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => {
                const selected = selectedIds.includes(device.id);
                const compatibility = getDeviceCompatibility(
                  device,
                  expectedOrientation,
                  expectedResolution,
                );
                const confirmed = resolutionConfirmations.has(device.id);
                const selectionBlocked =
                  !selected &&
                  (compatibility === "orientation-mismatch" ||
                    (compatibility === "resolution-mismatch" && !confirmed));

                return (
                  <tr
                    key={device.id}
                    className={`border-b border-zinc-100 last:border-0 dark:border-zinc-800 ${
                      selected ? "bg-indigo-50/60 dark:bg-indigo-500/10" : ""
                    }`}
                  >
                    <td className="px-5 py-4 align-top">
                      <input
                        type="checkbox"
                        aria-label={`Assign ${device.name}`}
                        checked={selected}
                        disabled={selectionBlocked}
                        onChange={() => onToggle(device.id)}
                        className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                      />
                    </td>
                    <td className="px-3 py-4 align-top">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{device.name}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-zinc-400">
                        {device.code ?? "Code unavailable"}
                      </p>
                    </td>
                    <td className="px-3 py-4 align-top">
                      <Badge
                        color={
                          device.health === "online"
                            ? "green"
                            : device.health === "warning"
                              ? "yellow"
                              : "red"
                        }
                      >
                        {device.health[0].toUpperCase() + device.health.slice(1)}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 align-top text-xs text-zinc-500 dark:text-zinc-400">
                      {formatChannelLastSeen(device.last_heartbeat_at)}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        <span>
                          Orientation: {device.orientation ?? "unavailable"}
                        </span>
                        <span>
                          Resolution: {device.resolution ?? "unavailable"}
                        </span>
                      </div>
                      <CompatibilityNote
                        compatibility={compatibility}
                        confirmed={confirmed}
                        deviceName={device.name}
                        onConfirm={(next) => onConfirmResolution(device.id, next)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
