"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/lovable/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/lovable/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/lovable/dropdown-menu";
import { Input } from "@/components/ui/lovable/input";
import { Label } from "@/components/ui/lovable/label";
import { MoreIcon } from "@/components/ui/icons";
import { renamePlayerRelease } from "./actions";

type Props = {
  release: { id: string; display_name: string; version: string; files: { name: string }[] };
  isBusy: boolean;
  onDownload: (file: string) => void;
};

/** ADR 0028 §11: file downloads, and (amendment 2) Rename, which changes the display name in any status. */
export function ReleaseMenu({ release, isBusy, onDownload }: Props) {
  const router = useRouter();
  const [isRenaming, setIsRenaming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const label = `${release.display_name} ${release.version}`;

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
    setIsRenaming(false);
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label={`Actions for ${label}`} disabled={isBusy}>
            <MoreIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => { setError(""); setIsRenaming(true); }}>Rename</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Download</DropdownMenuLabel>
          {release.files.map((file) => (
            <DropdownMenuItem key={file.name} onSelect={() => onDownload(file.name)}>
              {file.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={isRenaming} onOpenChange={(next) => { if (!isSaving) setIsRenaming(next); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {label}</DialogTitle>
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
    </>
  );
}
