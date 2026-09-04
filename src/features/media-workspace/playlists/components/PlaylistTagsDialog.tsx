"use client";

// Edits a Playlist's tags from the list row — a filing action, like Move to folder, not
// something the editor's revision lock needs to know about (ADR 0060 §8a). The chip input
// mirrors the Publication editor's tag field (BasicInfoForm.tsx): free text against a
// datalist of the tenant's existing vocabulary, so typing an existing name reuses it.

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { XIcon } from "@/components/ui/icons";
import { classifyApiError } from "@/lib/api/api-error";
import { fetchTags, setPlaylistTags } from "@/lib/api/media-api";
import type { Tag } from "@/types/domain";
import type { PlaylistListItem } from "../types";

export function PlaylistTagsDialog({
  target,
  onClose,
  onDone,
  onError,
}: {
  target: PlaylistListItem | null;
  onClose: () => void;
  onDone: (tags: Tag[]) => void;
  onError: (message: string) => void;
}) {
  // Remounted per target via the parent's `key`, so this initializer runs fresh each open.
  const [names, setNames] = useState<string[]>(() => (target?.tags ?? []).map((tag) => tag.name));
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [vocabulary, setVocabulary] = useState<Tag[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!target) return;
    let alive = true;
    fetchTags().then((tags) => alive && setVocabulary(tags)).catch(() => alive && setVocabulary([]));
    return () => { alive = false; };
  }, [target]);

  const addDraft = () => {
    const trimmed = draft.trim();
    setDraft("");
    setAdding(false);
    if (!trimmed || names.some((name) => name.toLowerCase() === trimmed.toLowerCase())) return;
    setNames((current) => [...current, trimmed]);
  };
  const removeName = (name: string) => setNames((current) => current.filter((n) => n !== name));

  const submit = async () => {
    if (!target) return;
    setBusy(true);
    try {
      onDone(await setPlaylistTags(target.id, names));
    } catch (err) {
      onError(classifyApiError(err, "อัปเดต Tags ไม่สำเร็จ").message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={target !== null}
      onClose={() => { if (!busy) onClose(); }}
      title="Edit tags"
      footer={<>
        <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>Cancel</Button>
        <Button type="button" disabled={busy} onClick={() => void submit()}>{busy ? "Saving…" : "Save"}</Button>
      </>}
    >
      <div className="flex flex-wrap items-center gap-2">
        {names.map((name) => (
          <span
            key={name}
            className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {name}
            <button
              type="button"
              onClick={() => removeName(name)}
              aria-label={`Remove ${name}`}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <XIcon className="h-3 w-3" />
            </button>
          </span>
        ))}
        {adding ? (
          <>
            <input
              autoFocus
              list="playlist-tags-vocabulary"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addDraft(); } }}
              onBlur={addDraft}
              placeholder="Tag name"
              className="w-28 rounded-full border border-indigo-300 px-3 py-1 text-xs outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-indigo-700 dark:bg-zinc-900"
            />
            <datalist id="playlist-tags-vocabulary">
              {vocabulary
                .filter((tag) => !names.some((name) => name.toLowerCase() === tag.name.toLowerCase()))
                .map((tag) => <option key={tag.id} value={tag.name} />)}
            </datalist>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-full border border-dashed border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-700 dark:text-zinc-300"
          >
            + Add tag
          </button>
        )}
      </div>
    </Modal>
  );
}
