"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/lovable/checkbox";
import { Input } from "@/components/ui/Input";
import { addPilotMember, listAllDevices } from "./actions";
import { countVersions, formatTime, isWindows, osOf, pilotBlocker, resolveVersion, type FleetDevice } from "./device-state";

const SELECT = "h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const HEALTH = { online: "success", warning: "warning", offline: "neutral" } as const;

/** ADR 0028 §11 items 3 and 4: every Media Device, its version, and a way to add devices to the test group. */
export function AllDevicesPanel({ devices }: { devices: Awaited<ReturnType<typeof listAllDevices>> }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [tenant, setTenant] = useState("");
  const [version, setVersion] = useState("");
  const [isWindowsOnly, setIsWindowsOnly] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [isBusy, setIsBusy] = useState(false);
  const [failures, setFailures] = useState<string[]>([]);
  const [added, setAdded] = useState(0);

  const all = useMemo(() => ("data" in devices ? devices.data : []), [devices]);
  const counts = useMemo(() => countVersions(all), [all]);
  const tenants = useMemo(() => [...new Map(all.map((device) => [device.tenant_id, device.tenant_name ?? "Unnamed tenant"]))].sort((a, b) => a[1].localeCompare(b[1])), [all]);

  const shown = useMemo(() => {
    const needle = text.trim().toLowerCase();
    return all.filter((device) =>
      (!needle || [device.name, device.tenant_name, device.active_channel?.name].some((value) => value?.toLowerCase().includes(needle))) &&
      (!tenant || device.tenant_id === tenant) &&
      (!version || (resolveVersion(device)?.version ?? "Unknown") === version) &&
      (!isWindowsOnly || isWindows(device)));
  }, [all, text, tenant, version, isWindowsOnly]);

  if ("error" in devices) {
    return (
      <section className="grid justify-items-start gap-3 rounded-xl border border-border bg-card p-6">
        <p role="alert">{devices.error}</p>
        <Button variant="outline" onClick={() => router.refresh()}>Retry</Button>
      </section>
    );
  }

  const toggle = (id: string, isOn: boolean) => setPicked((current) => {
    const next = new Set(current);
    if (isOn) next.add(id);
    else next.delete(id);
    return next;
  });

  // One audited call per device; each stands alone, so a failure leaves the others in place.
  async function addPicked() {
    setIsBusy(true);
    setFailures([]);
    const ids = [...picked];
    const problems: string[] = [];
    const done = new Set<string>();
    for (const id of ids) {
      const result = await addPilotMember(id);
      const name = all.find((device) => device.id === id)?.name ?? id;
      if ("error" in result) problems.push(`${name}: ${result.error}`);
      else done.add(id);
    }
    setIsBusy(false);
    setFailures(problems);
    setAdded(done.size);
    setPicked(new Set(ids.filter((id) => !done.has(id))));
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      <section className="flex flex-wrap items-center gap-2" aria-label="Devices per version">
        {counts.map(([name, count]) => (
          <button
            key={name}
            type="button"
            onClick={() => setVersion(version === name ? "" : name)}
            className={`rounded-lg border px-3 py-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${version === name ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
          >
            {name} · {count}
          </button>
        ))}
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <Input aria-label="Search devices" placeholder="Search device, tenant or channel" value={text} onChange={(event) => setText(event.target.value)} className="max-w-xs" />
        <select aria-label="Tenant" value={tenant} onChange={(event) => setTenant(event.target.value)} className={SELECT}>
          <option value="">All tenants</option>
          {tenants.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={isWindowsOnly} onCheckedChange={(next) => setIsWindowsOnly(next === true)} />
          Windows only
        </label>
        <span className="ml-auto text-sm text-muted-foreground">{shown.length} of {all.length} devices</span>
        <Button disabled={isBusy || picked.size === 0} onClick={() => void addPicked()}>
          {isBusy ? "Adding…" : `Add ${picked.size || ""} to test group`}
        </Button>
      </section>

      {added > 0 && failures.length === 0 && <p role="status" className="text-sm text-success">Added {added} {added === 1 ? "device" : "devices"} to the test group.</p>}
      {failures.length > 0 && (
        <div role="alert" className="grid gap-1 text-sm text-error">
          <p>{added} added, {failures.length} failed:</p>
          <ul>{failures.map((failure) => <li key={failure}>{failure}</li>)}</ul>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="w-10 p-3"><span className="sr-only">Select</span></th>
              <th className="p-3">Device</th>
              <th className="p-3">Tenant</th>
              <th className="p-3">Active channel</th>
              <th className="p-3">OS</th>
              <th className="p-3">Version</th>
              <th className="p-3">Status</th>
              <th className="p-3">Test group</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No devices match.</td></tr>
            )}
            {shown.map((device) => <DeviceRow key={device.id} device={device} isPicked={picked.has(device.id)} isDisabled={isBusy} onToggle={toggle} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeviceRow({ device, isPicked, isDisabled, onToggle }: {
  device: FleetDevice;
  isPicked: boolean;
  isDisabled: boolean;
  onToggle: (id: string, isOn: boolean) => void;
}) {
  const blocker = pilotBlocker(device);
  const resolved = resolveVersion(device);
  return (
    <tr className="border-b border-border last:border-0">
      <td className="p-3">
        <Checkbox
          aria-label={blocker ? `${device.name} unavailable: ${blocker}` : `Select ${device.name}`}
          title={blocker ?? undefined}
          checked={isPicked}
          disabled={isDisabled || blocker !== null}
          onCheckedChange={(next) => onToggle(device.id, next === true)}
        />
      </td>
      <td className="p-3 font-medium">{device.name}</td>
      <td className="p-3">{device.tenant_name ?? "—"}</td>
      <td className="p-3">{device.active_channel?.name ?? "—"}</td>
      <td className="p-3">{osOf(device) ?? "—"}</td>
      <td className="p-3">
        {resolved ? <>{resolved.version}<span className="block text-xs text-muted-foreground">{resolved.source}</span></> : "Unknown"}
      </td>
      <td className="p-3">
        <Badge variant={HEALTH[device.health]}>{device.health[0].toUpperCase() + device.health.slice(1)}</Badge>
        <span className="block text-xs text-muted-foreground">{formatTime(device.last_heartbeat_at)}</span>
      </td>
      <td className="p-3">
        {device.ring ? <Badge variant="info">In test group</Badge> : blocker ? <span className="text-xs text-muted-foreground">{blocker}</span> : "—"}
      </td>
    </tr>
  );
}
