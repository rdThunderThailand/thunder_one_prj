"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/lovable/label";
import { renamePlayerRelease } from "./actions";

type Props = {
  release: { id: string; display_name: string; version: string };
  isOpen: boolean;
  onOpenChange: (next: boolean) => void;
};

/** ADR 0028 §11 amendment 2 item 3: changes the display name in any status; version and files never change. */
export function ReleaseRenameDialog({ release, isOpen, onOpenChange }: Props) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function rename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    const result = await renamePlayerRelease(release.id, String(new FormData(event.currentTarget).get("name") ?? ""));
    setIsSaving(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(next) => { if (!isSaving) { setError(""); onOpenChange(next); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename {release.display_name} {release.version}</DialogTitle>
          <DialogDescription>Only the name changes. Version and files stay as uploaded.</DialogDescription>
        </DialogHeader>
        <form onSubmit={rename} className="grid justify-items-start gap-3">
          <Label htmlFor={`rename-${release.id}`}>Release name</Label>
          <Input
            id={`rename-${release.id}`}
            name="name"
            defaultValue={release.display_name}
            maxLength={120}
            required
            disabled={isSaving}
          />
          <Button type="submit" disabled={isSaving}>{isSaving ? "Saving…" : "Save"}</Button>
        </form>
        {error && <p role="alert" className="text-sm text-error">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
