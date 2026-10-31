import { useRef, useState } from "react";
import type { RegistrationOptions } from "../services/asset-registration-contract";

export interface RegistrationDocument { id: string; file: File }
export interface RegistrationDocumentGroup { files: RegistrationDocument[]; errors: string[] }
export type RegistrationDocumentGroups = Record<string, RegistrationDocumentGroup>;
export interface RetainedRegistrationFile { id: string; filename: string; size: number }

export function useRegistrationDocuments(rules: RegistrationOptions["documentUpload"], onSelectionChange: (target: string, selected: boolean, ids: string[]) => void,
  retained: Record<string, RetainedRegistrationFile[]> = {}, selectionIds: Record<string, string[]> = {}) {
  const [groups, setGroups] = useState<RegistrationDocumentGroups>({});
  const current = useRef<RegistrationDocumentGroups>({});
  function missingIds(target: string) {
    return (selectionIds[target] ?? []).filter((id) => !current.current[target]?.files.some((file) => file.id === id)
      && !retained[target]?.some((file) => file.id === id));
  }
  function publish(target: string, group: RegistrationDocumentGroup) {
    current.current = { ...current.current, [target]: group };
    setGroups(current.current);
  }
  function select(target: string, files: File[]) {
    if (!files.length) return;
    const existing = current.current[target]?.files ?? [];
    if (!rules) {
      publish(target, { files: existing, errors: ["Document limits are unavailable. Reload registration options before selecting documents."] });
      return;
    }
    const max = target === "asset" ? rules.maxAssetDocuments : rules.maxDocumentsPerWarranty;
    const retainedIds = (retained[target] ?? []).filter((item) => !existing.some((file) => file.id === item.id)).map((item) => item.id);
    const remaining = Math.max(0, max - existing.length - retainedIds.length);
    if (files.length > remaining) {
      publish(target, { files: existing, errors: [`Select no more than ${remaining} additional documents. Existing selections have been kept.`] });
      return;
    }
    const accepted: RegistrationDocument[] = [];
    const errors: string[] = [];
    const extensions: Record<string, string[]> = { "application/pdf": [".pdf"], "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] };
    for (const file of files) {
      const extension = /\.[^.]+$/.exec(file.name)?.[0].toLowerCase() ?? "";
      if (!file.name.trim() || file.name.length > 255 || /[/\\\u0000-\u001f\u007f]/.test(file.name)) {
        errors.push(`${file.name}: use a filename of 1–255 characters without slashes or control characters.`);
      } else if (!rules.mimeTypes.includes(file.type) || !rules.extensions.includes(extension) || !extensions[file.type]?.includes(extension)) {
        errors.push(`${file.name}: choose a PDF, JPEG or PNG with a matching file extension.`);
      } else if (!file.size || file.size > rules.maxBytesPerDocument) {
        errors.push(`${file.name}: choose a nonempty file no larger than ${rules.maxBytesPerDocument / 1048576} MiB.`);
      } else accepted.push({ id: crypto.randomUUID(), file });
    }
    publish(target, { files: [...existing, ...accepted], errors });
    if (accepted.length) {
      const missing = (selectionIds[target] ?? []).filter((id) => !existing.some((file) => file.id === id) && !retainedIds.includes(id));
      onSelectionChange(target, true, [...missing.slice(accepted.length), ...retainedIds, ...existing.map((document) => document.id), ...accepted.map((document) => document.id)]);
    }
  }
  function remove(target: string, id: string) {
    const files = (current.current[target]?.files ?? []).filter((document) => document.id !== id);
    publish(target, { files, errors: [] });
    const ids = [...new Set([...(selectionIds[target] ?? []).filter((selected) => selected !== id), ...files.map((document) => document.id), ...(retained[target] ?? []).filter((item) => item.id !== id).map((item) => item.id)])];
    onSelectionChange(target, ids.length > 0, ids);
  }
  function forget(target: string) {
    const next = { ...current.current };
    delete next[target];
    current.current = next;
    setGroups(next);
  }
  function clearReminder(target: string) {
    const missing = new Set(missingIds(target));
    const ids = (selectionIds[target] ?? []).filter((id) => !missing.has(id));
    onSelectionChange(target, ids.length > 0, ids);
  }
  return { groups, retained, missingIds, select, remove, forget, clearReminder };
}
export type RegistrationDocuments = ReturnType<typeof useRegistrationDocuments>;
