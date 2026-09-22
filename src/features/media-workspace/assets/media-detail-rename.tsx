"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Badge } from "@/components/ui/lovable/badge";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { classifyApiError } from "@/lib/api/api-error";
import { renameMediaAsset } from "@/lib/api/media-api";
import type { MediaAsset } from "@/types/domain";
import { assetLabel } from "./media-detail-preview";

export function InlineRename({ asset, onRenamed }: { asset: MediaAsset; onRenamed: (title: string) => void }) {
  const label = assetLabel(asset);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(label);
  const [error, setError] = useState("");
  const cancel = () => {
    setValue(label);
    setError("");
    setEditing(false);
  };
  const save = async () => {
    const next = value.trim();
    if (!next || next.length > 200) return setError(next ? "Name must be 200 characters or fewer." : "Name is required.");
    if (next === label) return cancel();
    try {
      await renameMediaAsset(asset.id, next);
      onRenamed(next);
      setError("");
      setEditing(false);
    } catch (reason) {
      setError(classifyApiError(reason, "Unable to rename media").message);
    }
  };
  if (!editing)
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <h1 className="min-w-0 truncate text-xl font-extrabold">{label}</h1>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label="Rename media" onClick={() => { setValue(label); setEditing(true); }}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Badge variant={asset.status === "failed" ? "danger" : "success"} className="shrink-0 capitalize">{asset.status ?? "ready"}</Badge>
        {asset.status !== "failed" && asset.rendition?.present && <Badge variant="info" className="shrink-0">แปลงแล้ว</Badge>}
      </div>
    );
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Input
          autoFocus
          value={value}
          maxLength={200}
          onChange={(e) => { setValue(e.target.value); setError(""); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void save();
            if (e.key === "Escape") cancel();
          }}
          aria-label="Media name"
          className="h-9 max-w-64 text-xs"
        />
        <Button size="icon" className="h-9 w-9" aria-label="Save media name" onClick={() => void save()}>
          <Check className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Cancel rename" onClick={cancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      {error && <p role="alert" className="mt-2 text-[11px] text-danger">{error}</p>}
    </div>
  );
}

