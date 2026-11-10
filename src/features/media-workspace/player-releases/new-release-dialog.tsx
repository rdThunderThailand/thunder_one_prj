"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/lovable/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/lovable/dialog";
import { Input } from "@/components/ui/lovable/input";
import { Label } from "@/components/ui/lovable/label";
import { preparePlayerRelease, registerPlayerRelease } from "./actions";

type Selection = { name: string; version: string; files: { name: string; size: number }[] };
type Draft = { id: string; selection: Selection };

/** ADR 0028 §11 item 2: upload in a dialog that cannot be dismissed, and warns before the tab leaves, while files move. */
export function NewReleaseDialog() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!isBusy) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isBusy]);

  function change(next: boolean) {
    if (isBusy) return;
    setIsOpen(next);
    if (!next) {
      setDraft(null);
      setStatus("");
      setError("");
    }
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const files = fields.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
    const selection: Selection = {
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
        const target = result.data.uploads[index];
        if (!target || target.name !== file.name) throw new Error("Could not prepare the selected files.");
        setStatus(`Uploading ${index + 1} of ${files.length}: ${file.name}`);
        const body = new FormData();
        body.append("cacheControl", "0");
        body.append("", file);
        const response = await fetch(target.url, { method: "PUT", body, headers: { "x-upsert": "false" } });
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

  async function finish() {
    if (!draft) return;
    setIsBusy(true);
    setError("");
    setStatus("Checking uploaded files…");
    try {
      const result = await registerPlayerRelease(draft.id, draft.selection);
      if ("error" in result) throw new Error(result.error);
      setIsBusy(false);
      change(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not register the release.");
      setStatus("");
      setIsBusy(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={change}>
      <DialogTrigger asChild>
        <Button>New release</Button>
      </DialogTrigger>
      <DialogContent onInteractOutside={(event) => { if (isBusy) event.preventDefault(); }} onEscapeKeyDown={(event) => { if (isBusy) event.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle>New release</DialogTitle>
          <DialogDescription>Windows x64 build. Files stay private until the release is approved.</DialogDescription>
        </DialogHeader>
        {draft ? (
          <div className="grid justify-items-start gap-3">
            <p>{draft.selection.name} · {draft.selection.version}</p>
            <ul className="text-sm text-muted-foreground">
              {draft.selection.files.map((file) => <li key={file.name}>{file.name}</li>)}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Button disabled={isBusy} onClick={() => void finish()}>Add release</Button>
              <Button variant="outline" disabled={isBusy} onClick={() => { setDraft(null); setStatus(""); setError(""); }}>Choose files again</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={upload} className="grid justify-items-start gap-3">
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
      </DialogContent>
    </Dialog>
  );
}
