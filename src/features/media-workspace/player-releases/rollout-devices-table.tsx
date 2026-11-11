"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/lovable/badge";
import { Input } from "@/components/ui/lovable/input";
import { formatTime, type FleetDevice } from "./device-state";
import { StageBar } from "./rollout-bars";
import {
  isInRollout,
  progressOf,
  rolloutOf,
  shownVersion,
  STATUS_LABEL,
  type DeviceStatus,
  type RolloutTarget,
} from "./rollout-device-status";

const SELECT = "h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const HEALTH = { online: "success", warning: "warning", offline: "neutral" } as const;
const STATUS_BADGE: Record<DeviceStatus, "success" | "danger" | "warning" | "info" | "neutral" | "outline"> = {
  test_group: "info", updated: "success", failed: "danger", timed_out: "warning", unsupported: "neutral",
  updating: "info", no_version: "neutral", not_eligible: "neutral", no_check: "neutral", on_version: "outline", waiting: "outline",
};

/** `in_rollout` is the default view; `all` shows every device, including those the rollout does not touch. */
export type StatusFilter = "in_rollout" | "all" | DeviceStatus;

/** ADR 0029 amendment 1: every Media device with its rollout status, filters and a way into its history. */
export function RolloutDevicesTable({ devices, target, statusFilter, onStatusFilter, onOpen }: {
  devices: FleetDevice[];
  target: RolloutTarget;
  statusFilter: StatusFilter;
  onStatusFilter: (next: StatusFilter) => void;
  onOpen: (device: FleetDevice) => void;
}) {
  const [text, setText] = useState("");
  const [tenant, setTenant] = useState("");
  const [version, setVersion] = useState("");
  const [health, setHealth] = useState("");

  const rows = useMemo(() => devices.map((device) => ({ device, rollout: rolloutOf(device, target) })), [devices, target]);
  const tenants = useMemo(() => [...new Map(devices.map((device) => [device.tenant_id, device.tenant_name ?? "Unnamed tenant"]))].sort((a, b) => a[1].localeCompare(b[1])), [devices]);
  const versions = useMemo(() => [...new Set(devices.map((device) => shownVersion(device) ?? "Unknown"))].sort(), [devices]);

  // ponytail: every device is filtered here; fine to a few thousand (about 0.5 KB a row), then move filtering into SQL.
  const shown = useMemo(() => {
    const needle = text.trim().toLowerCase();
    return rows.filter(({ device, rollout }) =>
      (statusFilter === "all" || (statusFilter === "in_rollout" ? isInRollout(rollout.status) : rollout.status === statusFilter)) &&
      (!needle || [device.name, device.tenant_name, device.active_channel?.name].some((value) => value?.toLowerCase().includes(needle))) &&
      (!tenant || device.tenant_id === tenant) &&
      (!version || (shownVersion(device) ?? "Unknown") === version) &&
      (!health || device.health === health));
  }, [rows, statusFilter, text, tenant, version, health]);

  return (
    <section className="grid gap-4 rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Devices</h2>
      <div className="flex flex-wrap items-center gap-3">
        <Input aria-label="Search devices" placeholder="Search device, tenant or channel" value={text} onChange={(event) => setText(event.target.value)} className="max-w-xs" />
        <select aria-label="Rollout status" value={statusFilter} onChange={(event) => onStatusFilter(event.target.value as StatusFilter)} className={SELECT}>
          <option value="in_rollout">In this rollout</option>
          <option value="all">All devices</option>
          {(Object.keys(STATUS_LABEL) as DeviceStatus[]).map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
        </select>
        <select aria-label="Tenant" value={tenant} onChange={(event) => setTenant(event.target.value)} className={SELECT}>
          <option value="">All tenants</option>
          {tenants.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <select aria-label="Version" value={version} onChange={(event) => setVersion(event.target.value)} className={SELECT}>
          <option value="">All versions</option>
          {versions.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <select aria-label="Health" value={health} onChange={(event) => setHealth(event.target.value)} className={SELECT}>
          <option value="">Any health</option>
          <option value="online">Online</option>
          <option value="warning">Warning</option>
          <option value="offline">Offline</option>
        </select>
        <span className="ml-auto text-sm text-muted-foreground">{shown.length} of {devices.length} devices</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="p-3">Device</th>
              <th className="p-3">Health</th>
              <th className="p-3">Version</th>
              <th className="p-3">Status</th>
              <th className="p-3">Progress</th>
              <th className="p-3">Last report</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No devices match.</td></tr>
            )}
            {shown.map(({ device, rollout }) => {
              const report = device.target_report;
              const current = shownVersion(device);
              return (
                <tr key={device.id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    <button type="button" onClick={() => onOpen(device)} className="text-left font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      {device.name}
                    </button>
                    <span className="block text-xs text-muted-foreground">
                      {device.tenant_name ?? "—"}
                      {device.registry_status !== "registered" && " · not registered"}
                      {device.lifecycle_status && ["DECOMMISSIONED", "RETIRED", "DISPOSED"].includes(device.lifecycle_status.toUpperCase()) && " · decommissioned"}
                    </span>
                  </td>
                  <td className="p-3">
                    <Badge variant={HEALTH[device.health]}>{device.health[0].toUpperCase() + device.health.slice(1)}</Badge>
                    <span className="block text-xs text-muted-foreground">{formatTime(device.last_heartbeat_at)}</span>
                  </td>
                  <td className="p-3">
                    {current ?? "Unknown"}
                    {target.version && <span className="block text-xs text-muted-foreground">target {target.version}</span>}
                  </td>
                  <td className="p-3"><Badge variant={STATUS_BADGE[rollout.status]}>{rollout.label}</Badge></td>
                  <td className="p-3"><StageBar progress={progressOf(device, rollout)} /></td>
                  <td className="p-3">
                    {report ? <>{formatTime(report.received_at)}{report.error_code && <span className="block text-xs text-error">{report.error_code}</span>}</> : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
