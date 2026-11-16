"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { FileIcon, FileImageIcon, RefreshIcon, TrashIcon, UploadIcon } from "@/components/ui/icons";
import { WARRANTY_DOCUMENTS_MAX } from "../../domain/warranty-form";
import type { WarrantyDocuments } from "./use-warranty-documents";

/** Copy of AssignAttachments for warranty documents (Q12): PDF, JPEG or PNG, at most two per record. */
export function WarrantyAttachments({ evidence, linked = 0 }: { evidence: WarrantyDocuments; linked?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const hint = useId();
  const full = evidence.items.length >= evidence.max;
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-foreground">Attachment (optional)</p>
      <div
        className={`relative flex flex-col items-center gap-2 rounded-control border border-dashed p-4 text-center ${over ? "border-primary bg-accent" : "border-border bg-muted"}`}
        onDragOver={(event) => { event.preventDefault(); if (!full) setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => { event.preventDefault(); setOver(false); if (!full) evidence.add(event.dataTransfer.files); }}
      >
        <UploadIcon
          aria-hidden="true"
          className="size-5 text-muted-foreground"
        />
        <p
          id={hint}
          className="text-2xs text-muted-foreground"
        >
          {full ? `This warranty already has ${WARRANTY_DOCUMENTS_MAX} documents.` : `Drop files here or choose them. PDF, JPEG or PNG, up to 10 MB, ${WARRANTY_DOCUMENTS_MAX} per warranty${linked ? ` (${linked} already attached)` : ""}.`}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={full}
          aria-describedby={hint}
          onClick={() => input.current?.click()}
        >
          Choose files
        </Button>
        <input
          ref={input}
          type="file"
          multiple
          accept="application/pdf,image/jpeg,image/png"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => { if (event.target.files) evidence.add(event.target.files); event.target.value = ""; }}
        />
      </div>
      {evidence.error && (
        <p
          role="alert"
          className="text-2xs text-error"
        >
          {evidence.error}
        </p>
      )}
      {evidence.items.length > 0 && (
        <ul className="divide-y divide-border rounded-control border border-border">
          {evidence.items.map((item) => {
            const Icon = item.file.type === "application/pdf" ? FileIcon : FileImageIcon;
            return (
              <li
                key={item.id}
                className="flex min-w-0 items-center gap-3 px-3 py-2"
              >
                <Icon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-foreground wrap-anywhere">{item.file.name}</span>
                  <span
                    role="status"
                    className={`block text-2xs ${item.status === "failed" ? "text-error" : "text-muted-foreground"}`}
                  >
                    {item.status === "failed" ? "Couldn't upload this file." : item.status === "done" ? "Uploaded" : `Uploading… ${item.percent}%`}
                  </span>
                </span>
                {item.status === "failed" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Retry ${item.file.name}`}
                    onClick={() => evidence.retry(item.id)}
                  >
                    <RefreshIcon
                      aria-hidden="true"
                      className="size-4"
                    />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${item.file.name}`}
                  onClick={() => evidence.remove(item.id)}
                >
                  <TrashIcon
                    aria-hidden="true"
                    className="size-4"
                  />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
