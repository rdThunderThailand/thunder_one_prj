"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { validateAssetFile, type ProfileUploadReceipt } from "../../domain/asset-files-edit";
import { ASSIGN_EVIDENCE_MAX, evidenceKind } from "../../domain/assignment-assign";
import { uploadProfileFile } from "../../services/asset-profile-file-upload";
import type { RegistrationOptions } from "../../services/asset-registration-contract";

export type EvidenceItem = { id: string; file: File; status: "uploading" | "done" | "failed"; percent: number; fileId?: string };

/** Optional handover evidence: each file uploads when added; Next waits until none is uploading. */
export function useAssignEvidence(context: string, rules: RegistrationOptions | null) {
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const receipts = useRef(new Map<string, ProfileUploadReceipt>());
  const live = useRef(new Set<string>());
  useEffect(() => () => live.current.clear(), []);

  const update = useCallback((id: string, patch: Partial<EvidenceItem>) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }, []);

  const upload = useCallback((id: string, file: File) => {
    const kind = evidenceKind(file) ?? "document";
    live.current.add(id);
    const check = () => { if (!live.current.has(id)) throw Object.assign(new Error("Removed"), { code: "CANCELLED" }); };
    uploadProfileFile(context, id, file, kind, receipts.current, (progress) => update(id, { percent: progress.percent }), check)
      .then((fileId) => { if (live.current.has(id)) update(id, { status: "done", percent: 100, fileId }); })
      .catch(() => { if (live.current.has(id)) update(id, { status: "failed" }); });
  }, [context, update]);

  function add(list: FileList | File[]) {
    const files = Array.from(list);
    const room = ASSIGN_EVIDENCE_MAX - items.length;
    const messages: string[] = [];
    if (files.length > room) messages.push(`Attach at most ${ASSIGN_EVIDENCE_MAX} files.`);
    const accepted: EvidenceItem[] = [];
    for (const file of files.slice(0, Math.max(0, room))) {
      const kind = evidenceKind(file);
      const maxBytes = kind === "photo" ? rules?.photoUpload?.maxBytesPerPhoto ?? 0 : rules?.documentUpload?.maxBytesPerDocument ?? 0;
      const invalid = kind ? validateAssetFile(file, kind, maxBytes) : `${file.name}: choose a PDF, JPEG or PNG file.`;
      if (invalid) messages.push(invalid);
      else accepted.push({ id: crypto.randomUUID(), file, status: "uploading", percent: 0 });
    }
    setError(messages.join(" ") || null);
    setItems((current) => [...current, ...accepted]);
    for (const item of accepted) upload(item.id, item.file);
  }

  function remove(id: string) {
    live.current.delete(id);
    receipts.current.delete(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function retry(id: string) {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    update(id, { status: "uploading", percent: 0 });
    upload(id, item.file);
  }

  function clear() {
    live.current.clear();
    receipts.current.clear();
    setItems([]);
    setError(null);
  }

  return {
    items, error, add, remove, retry, clear,
    busy: items.some((item) => item.status === "uploading"),
    failed: items.some((item) => item.status === "failed"),
    fileIds: items.flatMap((item) => item.fileId ? [item.fileId] : []),
  };
}
