"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/lovable/button";
import { downloadPlayerRelease, listPlayerReleases } from "./actions";
import { formatTime } from "./device-state";
import { ReleaseAdmission } from "./release-admission";
import { ReleaseMenu } from "./release-menu";

type ReleaseList = Awaited<ReturnType<typeof listPlayerReleases>>;

const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** ADR 0028 §11 item 2: one table, newest first; Approve, Withdraw and Delete in the row, Rename and downloads in a menu. */
export function ReleasePanel({ releases }: { releases: ReleaseList }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function download(id: string, file: string) {
    setError("");
    setIsBusy(true);
    try {
      const result = await downloadPlayerRelease(id, file);
      if ("error" in result) throw new Error(result.error);
      window.location.assign(result.data.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not download the file.");
    } finally {
      setIsBusy(false);
    }
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
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
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
            {releases.data.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No releases yet.</td></tr>
            )}
            {releases.data.map((release) => (
              <tr key={release.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium">{release.display_name}</td>
                <td className="p-3">{release.version}</td>
                <td className="p-3">{megabytes(release.files.reduce((sum, file) => sum + file.size, 0))}</td>
                <td className="p-3">{formatTime(release.created_at)}</td>
                <td className="p-3">
                  <ReleaseAdmission
                    downloadId={release.id}
                    label={`${release.display_name} ${release.version}`}
                    admitted={release.admitted ?? undefined}
                  />
                </td>
                <td className="p-3 text-right">
                  <ReleaseMenu release={release} isBusy={isBusy} onDownload={(file) => void download(release.id, file)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
