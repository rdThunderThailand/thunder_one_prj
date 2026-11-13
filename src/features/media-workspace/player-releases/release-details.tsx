"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { CopyIcon, DownloadIcon } from "@/components/ui/icons";
import { downloadPlayerRelease } from "./actions";
import { formatTime } from "./device-state";

type Props = {
  release: {
    id: string;
    display_name: string;
    version: string;
    created_at: string;
    files: { name: string; size: number; sha256: string }[];
    admitted: { admitted_at: string } | null;
  };
  badges: ReactNode;
};

export const megabytes = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/**
 * ADR 0028 §11 amendment 3 item 3: a release's details and file downloads. The name is the trigger, so focus
 * returns to it when the dialog closes.
 */
export function ReleaseDetails({ release, badges }: Props) {
  const [error, setError] = useState("");
  const [busyFile, setBusyFile] = useState("");
  const [copied, setCopied] = useState("");

  async function download(file: string) {
    setError("");
    setBusyFile(file);
    const result = await downloadPlayerRelease(release.id, file);
    setBusyFile("");
    if ("error" in result) setError(result.error);
    else window.location.assign(result.data.url);
  }

  function copy(file: { name: string; sha256: string }) {
    void navigator.clipboard.writeText(file.sha256).then(() => setCopied(file.name), () => setError("Could not copy the SHA-256."));
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-left font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {release.display_name}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{release.display_name} · {release.version}</DialogTitle>
          <DialogDescription>Windows x64 build</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2">{badges}</div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Uploaded</dt>
          <dd>{formatTime(release.created_at)}</dd>
          {release.admitted && (
            <>
              <dt className="text-muted-foreground">Approved</dt>
              <dd>{formatTime(release.admitted.admitted_at)}</dd>
            </>
          )}
        </dl>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="p-2">File</th>
                <th className="p-2">Size</th>
                <th className="p-2">SHA-256</th>
                <th className="p-2"><span className="sr-only">Download</span></th>
              </tr>
            </thead>
            <tbody>
              {release.files.map((file) => (
                <tr key={file.name} className="border-b border-border last:border-0">
                  <td className="p-2 break-all">{file.name}</td>
                  <td className="p-2 whitespace-nowrap">{megabytes(file.size)}</td>
                  <td className="p-2">
                    <span className="inline-flex items-center gap-1 font-mono text-xs" title={file.sha256}>
                      {file.sha256.slice(0, 12)}…
                      <Button variant="ghost" size="icon" aria-label={`Copy SHA-256 of ${file.name}`} onClick={() => copy(file)}>
                        <CopyIcon />
                      </Button>
                      {copied === file.name && <span role="status" className="text-muted-foreground">Copied</span>}
                    </span>
                  </td>
                  <td className="p-2 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyFile !== ""}
                      onClick={() => void download(file.name)}
                    >
                      <DownloadIcon />
                      {busyFile === file.name ? "Preparing…" : "Download"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {error && <p role="alert" className="text-sm text-error">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
