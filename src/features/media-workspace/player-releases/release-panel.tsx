"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/lovable/label";
import {
  downloadPlayerRelease,
  listPlayerReleases,
  preparePlayerRelease,
  registerPlayerRelease,
} from "./actions";

type ReleaseList = Awaited<ReturnType<typeof listPlayerReleases>>;
type Draft = {
  id: string;
  selection: { name: string; version: string; files: { name: string; size: number }[] };
};

export function ReleasePanel({ releases }: { releases: ReleaseList }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const files = fields.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
    const selection = {
      name: String(fields.get("name") ?? ""),
      version: String(fields.get("version") ?? "").trim(),
      files: files.map(({ name, size }) => ({ name, size })),
    };
    setIsBusy(true);
    setError("");
    setStatus("Preparing upload…");
    try {
      const result = await preparePlayerRelease(selection);
      if ("error" in result) throw new Error(result.error);
      for (const [index, file] of files.entries()) {
        const upload = result.data.uploads[index];
        if (!upload || upload.name !== file.name) throw new Error("Could not prepare the selected files.");
        setStatus(`Uploading ${index + 1} of ${files.length}: ${file.name}`);
        const body = new FormData();
        body.append("cacheControl", "0");
        body.append("", file);
        const response = await fetch(upload.url, { method: "PUT", body, headers: { "x-upsert": "false" } });
        if (!response.ok) throw new Error(`Could not upload ${file.name}. Check the file size and try again.`);
      }
      setDraft({ id: result.data.id, selection });
      setStatus("Files uploaded.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not upload files.");
      setStatus("");
    } finally {
      setIsBusy(false);
    }
  }

  async function markReady() {
    if (!draft) return;
    setIsBusy(true);
    setError("");
    setStatus("Checking uploaded files…");
    try {
      const result = await registerPlayerRelease(draft.id, draft.selection);
      if ("error" in result) throw new Error(result.error);
      setDraft(null);
      setStatus("Release ready to download.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not register the release.");
      setStatus("");
    } finally {
      setIsBusy(false);
    }
  }

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

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Upload Windows x64 build</h2>
        {draft ? (
          <div className="grid justify-items-start gap-3">
            <p>{draft.selection.name} · {draft.selection.version}</p>
            <ul className="text-sm text-muted-foreground">
              {draft.selection.files.map((file) => <li key={file.name}>{file.name}</li>)}
            </ul>
            <Button disabled={isBusy} onClick={() => void markReady()}>Ready to download</Button>
            <Button variant="outline" disabled={isBusy} onClick={() => { setDraft(null); setStatus(""); setError(""); }}>Choose files again</Button>
          </div>
        ) : (
          <form onSubmit={upload} className="grid max-w-lg justify-items-start gap-3">
            <Label htmlFor="release-name">Release name</Label>
            <Input id="release-name" name="name" maxLength={120} required disabled={isBusy} />
            <Label htmlFor="release-version">Build version</Label>
            <Input id="release-version" name="version" placeholder="1.2.0" maxLength={29} required disabled={isBusy} />
            <Label htmlFor="release-files">Build files</Label>
            <Input id="release-files" name="files" type="file" multiple required disabled={isBusy} />
            <Button type="submit" disabled={isBusy}>Upload files</Button>
          </form>
        )}
        {status && <p role="status" className="text-sm text-muted-foreground">{status}</p>}
        {error && <p role="alert" className="text-sm text-error">{error}</p>}
      </section>
      <section className="grid gap-4 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Ready to download</h2>
        {"error" in releases ? (
          <div className="grid justify-items-start gap-3">
            <p role="alert">{releases.error}</p>
            <Button variant="outline" onClick={() => router.refresh()}>Retry</Button>
          </div>
        ) : releases.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No releases yet.</p>
        ) : (
          <ul className="grid gap-4">
            {releases.data.map((release) => (
              <li key={release.id} className="grid gap-2 border-b border-border pb-4">
                <p className="font-medium">{release.display_name} · {release.version}</p>
                <ul className="grid justify-items-start gap-2">
                  {release.files.map((file) => (
                    <li key={file.name} className="min-w-0">
                      <Button variant="outline" disabled={isBusy} onClick={() => void download(release.id, file.name)}>
                        <span className="truncate">Download {file.name}</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
