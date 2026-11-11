"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/lovable/button";
import { Checkbox } from "@/components/ui/lovable/checkbox";
import { Input } from "@/components/ui/lovable/input";
import { getPilotTarget, listPlayerReleases } from "./actions";
import { DEFAULT_STATUSES, filterReleases, STATUS_LABELS, type ReleaseStatus } from "./release-filter";
import { ReleaseRow } from "./release-row";

type Loaded<T extends (...args: never[]) => Promise<unknown>> = Awaited<ReturnType<T>>;

const STATUSES = Object.keys(STATUS_LABELS) as ReleaseStatus[];

/** ADR 0028 §11 amendment 3: one table, newest first, searchable, Withdrawn hidden by default. */
export function ReleasePanel({ releases, target }: {
  releases: Loaded<typeof listPlayerReleases>;
  target: Loaded<typeof getPilotTarget>;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [statuses, setStatuses] = useState<ReleaseStatus[]>(DEFAULT_STATUSES);
  const all = useMemo(() => ("error" in releases ? [] : releases.data), [releases]);
  const { shown, hiddenWithdrawn } = useMemo(() => filterReleases(all, text, statuses), [all, text, statuses]);
  // The target points at player_releases.id, which is the row's admitted id, not its download id.
  const current = "error" in target ? null : target.data;

  function toggle(status: ReleaseStatus, isOn: boolean) {
    setStatuses((before) => (isOn ? [...before, status] : before.filter((item) => item !== status)));
  }

  if ("error" in releases) {
    return (
      <section className="grid justify-items-start gap-3 rounded-xl border border-border bg-card p-6">
        <p role="alert">{releases.error}</p>
        <Button variant="outline" onClick={() => router.refresh()}>Retry</Button>
      </section>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <Input
          aria-label="Search releases"
          placeholder="Search name or version"
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="max-w-xs"
        />
        <fieldset className="flex flex-wrap items-center gap-4">
          <legend className="sr-only">Status</legend>
          {STATUSES.map((status) => (
            <label key={status} className="flex items-center gap-2 text-sm">
              <Checkbox checked={statuses.includes(status)} onCheckedChange={(next) => toggle(status, next === true)} />
              {STATUS_LABELS[status]}
            </label>
          ))}
        </fieldset>
      </div>
      {"error" in target && <p role="alert" className="text-sm text-error">Could not load the test group version: {target.error}</p>}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Version</th>
              <th className="p-3">Size</th>
              <th className="p-3">Uploaded</th>
              <th className="p-3">Status</th>
              <th className="p-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  {all.length === 0 ? "No releases yet." : "No releases match the search and filters."}
                </td>
              </tr>
            )}
            {shown.map((release) => (
              <ReleaseRow
                key={release.id}
                release={release}
                target={current?.release_id && current.release_id === release.admitted?.id ? { isPaused: current.paused } : null}
              />
            ))}
          </tbody>
        </table>
      </div>
      {hiddenWithdrawn > 0 && (
        <p className="text-sm text-muted-foreground">
          {hiddenWithdrawn} withdrawn {hiddenWithdrawn === 1 ? "release" : "releases"} hidden ·{" "}
          <Button variant="link" className="h-auto p-0" onClick={() => toggle("withdrawn", true)}>Show</Button>
        </p>
      )}
    </div>
  );
}
