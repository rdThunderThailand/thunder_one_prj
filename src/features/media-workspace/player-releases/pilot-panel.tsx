"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
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
import { Checkbox } from "@/components/ui/lovable/checkbox";
import { Label } from "@/components/ui/lovable/label";
import {
  getPilotTarget,
  listPilotMembers,
  listPlayerReleases,
  pausePilotTarget,
  removePilotMember,
  setPilotTarget,
} from "./actions";
import { formatTime } from "./device-state";

type Loaded<T extends (...args: never[]) => Promise<unknown>> = Awaited<ReturnType<T>>;
type Choice = { id: string | null; label: string };

/** ADR 0028 §11: the update group (Update Ring `pilot`), its version, pause updates and its devices. */
export function PilotPanel({ members, target, releases, preselected }: {
  members: Loaded<typeof listPilotMembers>;
  target: Loaded<typeof getPilotTarget>;
  releases: Loaded<typeof listPlayerReleases>;
  /** ADR 0028 §11 amendment 3 item 4: "Send to update group" on Player releases opens this page with the release chosen. */
  preselected?: string;
}) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Choice | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [isRemoving, setIsRemoving] = useState(false);

  const approved = "error" in releases ? [] : releases.data.flatMap((release) =>
    release.admitted?.status === "ready" ? [{ id: release.admitted.id, label: `${release.display_name} · ${release.version}` }] : []);
  const current = "error" in target ? null : target.data;
  const deviceCount = "error" in members ? 0 : members.data.length;
  const chosen = preselected && approved.some((release) => release.id === preselected) ? preselected : current?.release_id ?? "";
  const memberIds = "data" in members ? members.data.flatMap((member) => (member.device ? [member.device.id] : [])) : [];
  const isAllPicked = memberIds.length > 0 && memberIds.every((id) => picked.has(id));
  const isChosenUnsaved = chosen !== (current?.release_id ?? "");

  async function run(action: () => Promise<{ data: unknown } | { error: string }>) {
    setIsBusy(true);
    setError("");
    const result = await action();
    setIsBusy(false);
    setPending(null);
    if ("error" in result) setError(result.error);
    else router.refresh();
  }

  // ADR 0028 amendment 5 item 7: one audited call per device; a failure leaves the others removed.
  async function removePicked() {
    setIsBusy(true);
    setError("");
    const failed: string[] = [];
    for (const id of picked) {
      const result = await removePilotMember(id);
      if ("error" in result) failed.push(`${"data" in members ? members.data.find((member) => member.device?.id === id)?.device?.name ?? id : id}: ${result.error}`);
    }
    setIsBusy(false);
    setIsRemoving(false);
    setPicked(new Set());
    if (failed.length > 0) setError(`${failed.length} not removed. ${failed.join("; ")}`);
    router.refresh();
  }

  const toggle = (id: string, isOn: boolean) => setPicked((current) => {
    const next = new Set(current);
    if (isOn) next.add(id);
    else next.delete(id);
    return next;
  });

  // Changing the version is the step that sends a build to devices, so it asks first, like Withdraw.
  function askToSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = String(new FormData(event.currentTarget).get("release") ?? "") || null;
    if (id === (current?.release_id ?? null)) return;
    setPending({ id, label: id ? approved.find((release) => release.id === id)?.label ?? "this version" : "" });
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
          <h2 className="text-lg font-semibold">Version for update group · Windows x64</h2>
          {current?.paused && <Badge variant="warning">Updates paused</Badge>}
        </div>
        <form key={`${current?.release_id ?? "none"}-${chosen}`} onSubmit={askToSave} className="grid max-w-lg justify-items-start gap-3">
          <Label htmlFor="pilot-release">Version the update group installs</Label>
          <select
            id="pilot-release"
            name="release"
            defaultValue={chosen}
            disabled={isBusy}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">No version</option>
            {approved.map((release) => <option key={release.id} value={release.id}>{release.label}</option>)}
          </select>
          {isChosenUnsaved && (
            <p role="status" className="text-sm text-muted-foreground">
              Chosen from Player releases and not saved yet. Press Save version to send it to the update group.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isBusy}>Save version</Button>
            {current && (
              <Button type="button" variant="outline" disabled={isBusy} onClick={() => void run(() => pausePilotTarget(!current.paused))}>
                {current.paused ? "Resume updates" : "Pause updates"}
              </Button>
            )}
          </div>
        </form>
        {current && <p className="text-sm text-muted-foreground">Policy revision {current.policy_revision} · updated {formatTime(current.updated_at)}</p>}
      </section>

      <section className="grid gap-4 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Devices in the update group</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" disabled={isBusy || picked.size === 0} onClick={() => setIsRemoving(true)}>
              {`Remove ${picked.size || ""} from group`}
            </Button>
            <Link href="/media-workspace/player-releases/all-devices" className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Add devices
            </Link>
          </div>
        </div>
        {"data" in members && members.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No devices yet. Add them from All devices.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="w-10 p-3">
                    <Checkbox
                      aria-label="Select all devices in the group"
                      checked={isAllPicked}
                      disabled={isBusy}
                      onCheckedChange={(next) => setPicked(next === true ? new Set(memberIds) : new Set())}
                    />
                  </th>
                  <th className="p-3">Device</th>
                  <th className="p-3">Version</th>
                  <th className="p-3">Last check</th>
                  <th className="p-3">Latest report</th>
                </tr>
              </thead>
              <tbody>
                {"data" in members && members.data.map((member) => {
                  const version = member.latest_report?.running_version
                    ? { text: member.latest_report.running_version, source: "update report" }
                    : member.last_check ? { text: member.last_check.app_version, source: "update check" }
                    : member.device?.app_version ? { text: member.device.app_version, source: "device record" } : null;
                  return (
                    <tr key={member.device?.id ?? member.added_at} className="border-b border-border last:border-0">
                      <td className="p-3">
                        {member.device && (
                          <Checkbox
                            aria-label={`Select ${member.device.name}`}
                            checked={picked.has(member.device.id)}
                            disabled={isBusy}
                            onCheckedChange={(next) => toggle(member.device!.id, next === true)}
                          />
                        )}
                      </td>
                      <td className="p-3 font-medium">{member.device?.name ?? "Deleted device"}</td>
                      <td className="p-3">
                        {version ? <>{version.text}<span className="block text-xs text-muted-foreground">{version.source}</span></> : "Unknown"}
                      </td>
                      <td className="p-3">{formatTime(member.last_check?.checked_at)}</td>
                      <td className="p-3">
                        {member.latest_report
                          ? <>{member.latest_report.state}{member.latest_report.error_code ? ` (${member.latest_report.error_code})` : ""}<span className="block text-xs text-muted-foreground">{formatTime(member.latest_report.received_at)}</span></>
                          : <span className="text-muted-foreground">No update report yet</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AlertDialog open={isRemoving} onOpenChange={(next) => { if (!isBusy && !next) setIsRemoving(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {picked.size} {picked.size === 1 ? "device" : "devices"} from the update group?</AlertDialogTitle>
            <AlertDialogDescription>
              They stop being offered versions. A version they have already installed stays.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isBusy}
              onClick={(event) => {
                event.preventDefault();
                void removePicked();
              }}
            >
              {isBusy ? "Removing…" : "Remove devices"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pending !== null} onOpenChange={(next) => { if (!isBusy && !next) setPending(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pending?.id ? `Send ${pending.label} to the update group?` : "Stop updating the update group?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.id
                ? `${deviceCount} ${deviceCount === 1 ? "device" : "devices"} will download this version and install it in their update window.`
                : "Devices will no longer be offered a version. A version they have already installed stays."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isBusy}
              onClick={(event) => {
                event.preventDefault();
                if (pending) void run(() => setPilotTarget(pending.id));
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
