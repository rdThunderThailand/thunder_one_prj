import { useEffect, useRef, useState } from "react";
import type { RegistrationOptions } from "../services/asset-registration-contract";
import type { RetainedRegistrationFile } from "./use-registration-documents";
import type { UploadCandidate } from "../domain/registration-confirmation";

export interface RegistrationPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

export function useRegistrationPhotos(rules: RegistrationOptions["photoUpload"], onSelectionChange: (selected: boolean, ids: string[]) => void, retained: RetainedRegistrationFile[] = []) {
  const [photos, setPhotos] = useState<RegistrationPhoto[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const current = useRef<RegistrationPhoto[]>([]);

  useEffect(() => () => {
    for (const photo of current.current) URL.revokeObjectURL(photo.previewUrl);
  }, []);

  function select(files: File[]) {
    if (!files.length) return;
    if (!rules) {
      setErrors(["Photo limits are unavailable. Reload registration options before selecting photos."]);
      return;
    }
    const retainedIds = retained.filter((item) => !current.current.some((photo) => photo.id === item.id)).map((item) => item.id);
    const remaining = Math.max(0, rules.maxPhotos - current.current.length - retainedIds.length);
    if (files.length > remaining) {
      setErrors([`Select no more than ${remaining} additional ${remaining === 1 ? "photo" : "photos"}. Your existing photos have been kept.`]);
      return;
    }
    const accepted: RegistrationPhoto[] = [];
    const rejected: string[] = [];
    for (const file of files) {
      const extensionMatches = file.type === "image/jpeg" ? /\.jpe?g$/i.test(file.name)
        : file.type === "image/png" && /\.png$/i.test(file.name);
      if (!file.name.trim() || file.name.length > 255 || /[/\\\u0000-\u001f\u007f]/.test(file.name)) {
        rejected.push(`${file.name}: use a valid filename of 1–255 characters without slashes or control characters.`);
      } else if (!extensionMatches) {
        rejected.push(`${file.name}: choose a JPEG or PNG photo with a matching file extension.`);
      } else if (file.size === 0 || file.size > rules.maxBytesPerPhoto) {
        rejected.push(`${file.name}: choose a nonempty photo no larger than ${rules.maxBytesPerPhoto / 1048576} MiB.`);
      } else {
        accepted.push({ id: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file) });
      }
    }
    setErrors(rejected);
    if (!accepted.length) return;
    const next = [...current.current, ...accepted];
    current.current = next;
    setPhotos(next);
    onSelectionChange(true, [...retainedIds, ...next.map((photo) => photo.id)]);
  }

  function remove(id: string) {
    const removed = current.current.find((photo) => photo.id === id);
    if (removed) URL.revokeObjectURL(removed.previewUrl);
    const next = current.current.filter((photo) => photo.id !== id);
    current.current = next;
    setPhotos(next);
    setErrors([]);
    const ids = [...new Set([...next.map((photo) => photo.id), ...retained.filter((item) => item.id !== id).map((item) => item.id)])];
    onSelectionChange(ids.length > 0, ids);
  }

  function restore(files: UploadCandidate[]) {
    const restored = files.filter((file) => file.purpose === "asset_photo");
    const next = restored.map((item) => current.current.find((photo) => photo.id === item.localId)
      ?? { id: item.localId, file: item.file, previewUrl: URL.createObjectURL(item.file) });
    for (const photo of current.current) {
      if (!next.some((item) => item.id === photo.id)) URL.revokeObjectURL(photo.previewUrl);
    }
    current.current = next;
    setPhotos(next);
  }

  return { photos, errors, select, remove, restore };
}
