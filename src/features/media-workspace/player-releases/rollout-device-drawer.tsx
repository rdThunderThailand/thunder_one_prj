"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/lovable/sheet";
import { getDeviceHistory } from "./actions";
import { formatTime, type FleetDevice } from "./device-state";
import { type DeviceRollout } from "./rollout-device-status";

type History = Awaited<ReturnType<typeof getDeviceHistory>>;

const formatBytes = (bytes: number | null) => (bytes === null ? "Unknown" : `${(bytes / 1024 ** 3).toFixed(1)} GB`);

/** ADR 0029 amendment 1 item 7: read-only. The latest update-check and the last 50 update reports, loaded on open. */
export function RolloutDeviceDrawer({ device, rollout, onClose }: { device: FleetDevice; rollout: DeviceRollout; onClose: () => void }) {
  const [history, setHistory] = useState<History | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    void getDeviceHistory(device.id).then((result) => {
      if (isCurrent) setHistory(result);
    });
    return () => { isCurrent = false; };
  }, [device.id, attempt]);

  const data = history && "data" in history ? history.data : null;
  const check = data?.last_check;
  return (
    <Sheet open onOpenChange={(next) => { if (!next) onClose(); }}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{device.name}</SheetTitle>
          <SheetDescription>{device.tenant_name ?? "Unnamed tenant"} · {rollout.label}</SheetDescription>
        </SheetHeader>

        {history === null && <p role="status" className="mt-6 text-sm text-muted-foreground">Loading update history…</p>}
        {history && "error" in history && (
          <div className="mt-6 grid justify-items-start gap-3">
            <p role="alert" className="text-sm text-error">{history.error}</p>
            <Button variant="outline" onClick={() => { setHistory(null); setAttempt((count) => count + 1); }}>Retry</Button>
          </div>
        )}

        {data && (
          <div className="mt-6 grid gap-6 text-sm">
            <section className="grid gap-2">
              <h3 className="font-semibold">Latest update check</h3>
              {check ? (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {([
                    ["Checked", formatTime(check.checked_at)],
                    ["App version", check.app_version],
                    ["Track", check.update_track],
                    ["Install mode", check.update_install_mode],
                    ["Updater", check.updater_version ?? "Unknown"],
                    ["OS", check.os_version ?? "Unknown"],
                    ["Free space", formatBytes(check.free_bytes)],
                    ["Silent install", check.silent_install_supported === null ? "Unknown" : check.silent_install_supported ? "Supported" : "Not supported"],
                  ] as const).map(([label, value]) => (
                    <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd>{value}</dd></div>
                  ))}
                </dl>
              ) : <p className="text-muted-foreground">This device has never checked for updates.</p>}
            </section>

            <section className="grid gap-2">
              <h3 className="font-semibold">Update reports</h3>
              {data.reports.length === 0 ? <p className="text-muted-foreground">No update reports yet.</p> : (
                <ol className="grid gap-3">
                  {data.reports.map((report) => (
                    <li key={report.id} className="rounded-lg border border-border p-3">
                      <p className="font-medium">{report.state.replace("_", " ")}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(report.received_at)}
                        {report.from_version && ` · ${report.from_version} → ${report.target_version ?? "?"}`}
                        {report.running_version && ` · running ${report.running_version}`}
                      </p>
                      {(report.error_stage || report.error_code) && (
                        <p className="mt-1 text-xs text-error">{[report.error_stage, report.error_code].filter(Boolean).join(" · ")}</p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
