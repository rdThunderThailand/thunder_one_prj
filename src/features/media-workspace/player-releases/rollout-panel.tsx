"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/lovable/alert-dialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/lovable/label";
import {
  listAllDevices,
  listPlayerReleases,
  pauseProductionTarget,
  setProductionLimits,
  setProductionTarget,
  type RolloutStatus,
} from "./actions";
import { formatTime } from "./device-state";
import { StackedBar } from "./rollout-bars";
import { RolloutDeviceDrawer } from "./rollout-device-drawer";
import { countStatuses, rolloutOf, STATUS_LABEL, type DeviceStatus } from "./rollout-device-status";
import { RolloutDevicesTable, type StatusFilter } from "./rollout-devices-table";
import { failureBudget, freeSlots, pauseReasonText } from "./rollout-summary";

type Choice = { id: string | null; label: string };

const DEFAULT_CAP = 20;
const DEFAULT_FAILURE_LIMIT = 3;

/** ADR 0029 §4: production ring version, pause, limits, live counts and the devices that need a look. */
export function RolloutPanel({ status, releases, devices }: {
  status: { data: RolloutStatus } | { error: string };
  releases: Awaited<ReturnType<typeof listPlayerReleases>>;
  devices: Awaited<ReturnType<typeof listAllDevices>>;
}) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Choice | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("in_rollout");
  const [openId, setOpenId] = useState<string | null>(null);

  const all = useMemo(() => ("data" in devices ? devices.data : []), [devices]);
  const target = useMemo(() => ({
    version: "data" in status ? status.data?.version ?? null : null,
    isPaused: "data" in status ? status.data?.paused ?? false : false,
  }), [status]);
  const counts = useMemo(() => countStatuses(all, target), [all, target]);

  const loadError = ("error" in status && status.error) || ("error" in devices && devices.error);
  if (loadError) {
    return (
      <section className="grid justify-items-start gap-3 rounded-xl border border-border bg-card p-6">
        <p role="alert">{loadError}</p>
        <Button variant="outline" onClick={() => router.refresh()}>Retry</Button>
      </section>
    );
  }

  if ("error" in status) return null; // narrowed above; keeps the type checker honest
  const current = status.data;
  const approved = "error" in releases ? [] : releases.data.flatMap((release) =>
    release.admitted?.status === "ready" ? [{ id: release.admitted.id, label: `${release.display_name} · ${release.version}` }] : []);
  const cap = current?.in_flight_cap ?? DEFAULT_CAP;
  const failureLimit = current?.failure_limit ?? DEFAULT_FAILURE_LIMIT;
  const budget = failureBudget(counts.failed, counts.timed_out, failureLimit);
  const rolloutTotal = counts.updated + counts.updating + counts.failed + counts.timed_out + counts.unsupported + counts.waiting;
  const opened = all.find((device) => device.id === openId) ?? null;
  const autoPause = current?.paused ? pauseReasonText(current.pause_reason) : null;

  async function run(action: () => Promise<{ data: unknown } | { error: string }>) {
    setIsBusy(true);
    setError("");
    const result = await action();
    setIsBusy(false);
    setPending(null);
    if ("error" in result) setError(result.error);
    else router.refresh();
  }

  // Changing the version is the step that sends a build to every device, so it asks first.
  function askToSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = String(new FormData(event.currentTarget).get("release") ?? "") || null;
    if (id === (current?.release_id ?? null)) return;
    setPending({ id, label: id ? approved.find((release) => release.id === id)?.label ?? "this version" : "" });
  }

  function saveLimits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void run(() => setProductionLimits(Number(data.get("cap")), Number(data.get("limit"))));
  }

  return (
    <div className="grid gap-6">
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      {autoPause && <p role="status" className="rounded-xl border border-border bg-warning-muted p-4 text-sm">{autoPause} Check the devices below, then resume.</p>}

      <section className="grid gap-4 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">Version for all devices · Windows x64</h2>
          {current?.paused && <Badge variant="warning">Updates paused</Badge>}
        </div>
        <form key={current?.release_id ?? "none"} onSubmit={askToSave} className="grid max-w-lg justify-items-start gap-3">
          <Label htmlFor="rollout-release">Version every device installs</Label>
          <select
            id="rollout-release"
            name="release"
            defaultValue={current?.release_id ?? ""}
            disabled={isBusy}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">No version</option>
            {approved.map((release) => <option key={release.id} value={release.id}>{release.label}</option>)}
          </select>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isBusy}>Save version</Button>
            {current && (
              <Button type="button" variant="outline" disabled={isBusy} onClick={() => void run(() => pauseProductionTarget(!current.paused))}>
                {current.paused ? "Resume updates" : "Pause updates"}
              </Button>
            )}
          </div>
        </form>
        {current && <p className="text-sm text-muted-foreground">Policy revision {current.policy_revision} · updated {formatTime(current.updated_at)}</p>}
      </section>

      <section className="grid gap-4 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Limits</h2>
        <form key={`${cap}-${failureLimit}`} onSubmit={saveLimits} className="flex flex-wrap items-end gap-3">
          <div className="grid gap-2">
            <Label htmlFor="rollout-cap">Devices updating at once</Label>
            <Input id="rollout-cap" name="cap" type="number" min={1} max={10000} defaultValue={cap} disabled={isBusy} className="w-40" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rollout-limit">Failures before pausing</Label>
            <Input id="rollout-limit" name="limit" type="number" min={1} max={100} defaultValue={failureLimit} disabled={isBusy} className="w-40" />
          </div>
          <Button type="submit" variant="outline" disabled={isBusy}>Save limits</Button>
        </form>
        {!current && <p className="text-sm text-muted-foreground">No rollout yet. Saving limits creates it; then choose a version.</p>}
      </section>

      {current && (
        <section className="grid gap-4 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Progress</h2>
            <Button variant="outline" onClick={() => router.refresh()}>Refresh</Button>
          </div>
          <StackedBar
            total={rolloutTotal}
            segments={[
              { label: "Updated", count: counts.updated, tone: "success" },
              { label: "Updating", count: counts.updating, tone: "primary" },
              { label: "Failed", count: counts.failed, tone: "error" },
              { label: "Timed out", count: counts.timed_out, tone: "warning" },
              { label: "Not supported", count: counts.unsupported, tone: "neutral" },
            ]}
          />
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-6">
            {([
              ["updating", `${counts.updating} of ${cap}`],
              ["waiting", String(counts.waiting)],
              ["updated", String(counts.updated)],
              ["failed", String(counts.failed)],
              ["timed_out", String(counts.timed_out)],
              ["unsupported", String(counts.unsupported)],
            ] as [DeviceStatus, string][]).map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs text-muted-foreground">
                  <button type="button" onClick={() => setStatusFilter(key)} className="underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {key === "updating" ? "Updating now" : STATUS_LABEL[key]}
                  </button>
                </dt>
                <dd className="text-lg font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-muted-foreground">
            {freeSlots(counts.updating, cap)} free {freeSlots(counts.updating, cap) === 1 ? "slot" : "slots"} · {budget.used} of {failureLimit} failures before pausing · {rolloutTotal} {rolloutTotal === 1 ? "device" : "devices"} in this rollout
          </p>
        </section>
      )}

      <RolloutDevicesTable
        devices={all}
        target={target}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        onOpen={(device) => setOpenId(device.id)}
      />
      {opened && <RolloutDeviceDrawer key={opened.id} device={opened} rollout={rolloutOf(opened, target)} onClose={() => setOpenId(null)} />}

      <AlertDialog open={pending !== null} onOpenChange={(next) => { if (!isBusy && !next) setPending(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pending?.id ? `Send ${pending.label} to every device?` : "Stop updating all devices?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.id
                ? `Devices outside the test group will download this version, up to ${cap} at a time. The rollout pauses by itself after ${failureLimit} failures.`
                : "Devices will no longer be offered a version. A version they have already installed stays."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isBusy}
              onClick={(event) => {
                event.preventDefault();
                if (pending) void run(() => setProductionTarget(pending.id));
              }}
            >
              {isBusy ? "Saving…" : "Save version"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
