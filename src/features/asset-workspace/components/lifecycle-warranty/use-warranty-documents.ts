"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { validateAssetFile, type ProfileUploadReceipt } from "../../domain/asset-files-edit";
import { evidenceKind } from "../../domain/assignment-assign";
import { WARRANTY_DOCUMENTS_MAX } from "../../domain/warranty-form";
import { uploadProfileFile, type ProfileFileUploadClient } from "../../services/asset-profile-file-upload";
import type { RegistrationOptions } from "../../services/asset-registration-contract";

export type WarrantyDocument = { id: string; file: File; status: "uploading" | "done" | "failed"; percent: number; fileId?: string };

/** The existing upload client with purpose `warranty_document`, so Core stores it under `warranties/…/documents/`. */
async function warrantyClient(warrantyClientId: string): Promise<ProfileFileUploadClient> {
  const [client, transport] = await Promise.all([
    import("../../services/asset-registration-client"), import("../../services/registration-upload-transport"),
  ]);
  return {
    reserve: (context, input) => client.reserveRegistrationUpload(context,
      { ...input, purpose: "warranty_document", warranty_client_id: warrantyClientId }),
    complete: client.completeRegistrationUpload,
    put: transport.putRegistrationUpload,
  };
}

/** Optional warranty documents (Q12): up to 2, each uploads when added; Next waits until none is uploading. Same shape
 *  as useAssignEvidence. Edit adds documents only, so `room` counts the record's linked ones. */
export function useWarrantyDocuments(context: string, rules: RegistrationOptions | null, linked = 0) {
  const [items, setItems] = useState<WarrantyDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const receipts = useRef(new Map<string, ProfileUploadReceipt>());
  const live = useRef(new Set<string>());
  const clientId = useRef<string | null>(null);
  useEffect(() => () => live.current.clear(), []);
  const max = Math.max(0, WARRANTY_DOCUMENTS_MAX - linked);

  const update = useCallback((id: string, patch: Partial<WarrantyDocument>) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }, []);

  const upload = useCallback((id: string, file: File) => {
    live.current.add(id);
    clientId.current ??= crypto.randomUUID();
    const check = () => { if (!live.current.has(id)) throw Object.assign(new Error("Removed"), { code: "CANCELLED" }); };
    warrantyClient(clientId.current)
      .then((client) => uploadProfileFile(context, id, file, "document", receipts.current,
        (progress) => update(id, { percent: progress.percent }), check, client))
      .then((fileId) => { if (live.current.has(id)) update(id, { status: "done", percent: 100, fileId }); })
      .catch(() => { if (live.current.has(id)) update(id, { status: "failed" }); });
  }, [context, update]);

  function add(list: FileList | File[]) {
    const files = Array.from(list);
    const room = max - items.length;
    const messages: string[] = [];
    if (files.length > room) messages.push(`Attach at most ${WARRANTY_DOCUMENTS_MAX} files per warranty.`);
    const accepted: WarrantyDocument[] = [];
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

  return {
    items, error, add, remove, retry, max,
    busy: items.some((item) => item.status === "uploading"),
    failed: items.some((item) => item.status === "failed"),
    fileIds: items.flatMap((item) => item.fileId ? [item.fileId] : []),
  };
}

export type WarrantyDocuments = ReturnType<typeof useWarrantyDocuments>;
