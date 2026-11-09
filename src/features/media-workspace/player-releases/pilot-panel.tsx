"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/lovable/badge";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Label } from "@/components/ui/lovable/label";
import {
  addPilotMember,
  getPilotTarget,
  listPilotMembers,
  listPlayerReleases,
  pausePilotTarget,
  removePilotMember,
  searchDevices,
  setPilotTarget,
} from "./actions";

type Loaded<T extends (...args: never[]) => Promise<unknown>> = Awaited<ReturnType<T>>;
type Found = Extract<Loaded<typeof searchDevices>, { data: unknown }>["data"];

// ponytail: fixed Asia/Bangkok so server and client render the same text; use the viewer's zone if users span zones.
const TIME = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", hourCycle: "h23", timeZone: "Asia/Bangkok" });
const at = (value: string | null | undefined) => (value ? TIME.format(new Date(value)) : "Never");

/** ADR 0028 §11: pilot members, the pilot target, pause and resume. */
export function PilotPanel({ members, target, releases }: {
  members: Loaded<typeof listPilotMembers>;
  target: Loaded<typeof getPilotTarget>;
  releases: Loaded<typeof listPlayerReleases>;
}) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");
  const [found, setFound] = useState<Found | null>(null);

  const admitted = "error" in releases ? [] : releases.data.flatMap((release) =>
    release.admitted?.status === "ready" ? [{ id: release.admitted.id, label: `${release.display_name} · ${release.version}` }] : []);
  const current = "error" in target ? null : target.data;
  const memberIds = new Set("error" in members ? [] : members.data.map((member) => member.device?.id));

  async function run(action: () => Promise<{ data: unknown } | { error: string }>) {
    setIsBusy(true);
    setError("");
    const result = await action();
    setIsBusy(false);
    if ("error" in result) setError(result.error);
    else router.refresh();
    return result;
  }

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = String(new FormData(event.currentTarget).get("search") ?? "").trim();
    if (!text) return;
    const result = await run(() => searchDevices(text));
    if ("data" in result) setFound(result.data as Found);
  }

  function saveTarget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const releaseId = String(new FormData(event.currentTarget).get("release") ?? "");
    void run(() => setPilotTarget(releaseId || null));
  }

  const loadError = ["error" in members && members.error, "error" in target && target.error].find(Boolean);
  if (loadError) {
    return (
      <section className="grid justify-items-start gap-3 rounded-xl border border-border bg-card p-6">
        <p role="alert">{loadError}</p>
        <Button variant="outline" onClick={() => router.refresh()}>Retry</Button>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      <section className="grid gap-4 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">Pilot target · Windows x64</h2>
          {current?.paused && <Badge variant="warning">Paused</Badge>}
        </div>
        <form key={current?.release_id ?? "none"} onSubmit={saveTarget} className="grid max-w-lg justify-items-start gap-3">
          <Label htmlFor="pilot-release">Release devices install</Label>
          <select
            id="pilot-release"
            name="release"
            defaultValue={current?.release_id ?? ""}
            disabled={isBusy}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">No target</option>
            {admitted.map((release) => <option key={release.id} value={release.id}>{release.label}</option>)}
          </select>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isBusy}>Save target</Button>
            {current && (
              <Button type="button" variant="outline" disabled={isBusy} onClick={() => void run(() => pausePilotTarget(!current.paused))}>
                {current.paused ? "Resume" : "Pause"}
              </Button>
            )}
          </div>
        </form>
        {current && <p className="text-sm text-muted-foreground">Policy revision {current.policy_revision} · updated {at(current.updated_at)}</p>}
      </section>

      <section className="grid gap-4 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Pilot devices</h2>
        {"data" in members && members.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No devices in the pilot ring yet.</p>
        ) : (
          <ul className="grid gap-3">
            {"data" in members && members.data.map((member) => (
              <li key={member.device?.id ?? member.added_at} className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
                <div className="grid gap-1 text-sm">
                  <p className="font-medium">{member.device?.name ?? "Deleted device"}</p>
                  <p className="text-muted-foreground">
                    Running {member.latest_report?.running_version ?? member.last_check?.app_version ?? member.device?.app_version ?? "unknown"}
                    {" · "}last check {at(member.last_check?.checked_at)}
                  </p>
                  <p className="text-muted-foreground">
                    {member.latest_report
                      ? `Latest report: ${member.latest_report.state}${member.latest_report.error_code ? ` (${member.latest_report.error_code})` : ""} · ${at(member.latest_report.received_at)}`
                      : "No update report yet"}
                  </p>
                </div>
                {member.device && (
                  <Button variant="outline" disabled={isBusy} onClick={() => void run(() => removePilotMember(member.device!.id))}>
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={search} className="flex max-w-lg flex-wrap items-end gap-3">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="device-search">Add a Media device</Label>
            <Input id="device-search" name="search" placeholder="Device name" maxLength={100} disabled={isBusy} />
          </div>
          <Button type="submit" variant="outline" disabled={isBusy}>Search</Button>
        </form>
        {found && (found.length === 0 ? (
          <p className="text-sm text-muted-foreground">No devices match.</p>
        ) : (
          <ul className="grid gap-2">
            {found.map((device) => (
              <li key={device.id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span>{device.name} · {device.app_version ?? "unknown version"}</span>
                {memberIds.has(device.id) ? (
                  <Badge variant="neutral">In pilot</Badge>
                ) : (
                  <Button variant="outline" disabled={isBusy} onClick={() => void run(() => addPilotMember(device.id))}>Add to pilot</Button>
                )}
              </li>
            ))}
          </ul>
        ))}
      </section>
    </div>
  );
}
