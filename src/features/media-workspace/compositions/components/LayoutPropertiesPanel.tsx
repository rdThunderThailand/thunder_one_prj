"use client";

// ADR 0063 §1 and §4: everything the Create modal used to ask for lives here instead. The
// modal picks a starting geometry and nothing else — resolution and background belong next
// to the canvas they reshape, and filing (Folder, Tags) is a decision an operator has not
// made yet when they are choosing a layout.
//
// Presentational on purpose. Resolution and background sit on the shared `layouts` row, so
// changing them can need ADR 0052 §3's interruption — the page owns that guard and hands
// this panel an `onSettingsChange` that has already asked.

import { useEffect, useState } from "react";
import { XIcon } from "@/components/ui/icons";
import { fetchTags } from "@/lib/api/media-api";
import { deriveAspectRatio, parseResolution } from "@/features/media-workspace/layouts/geometry";
import { RESOLUTION_PRESETS } from "@/features/media-workspace/layouts/types";
import type { ContentFolder, Tag } from "@/types/domain";
import type { LayoutSettingsDraft } from "../save-composition";

const inputClasses =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
const labelClasses = "text-xs font-semibold uppercase tracking-wide text-zinc-500";

export function LayoutPropertiesPanel({
  name,
  onNameChange,
  folders,
  folderId,
  onFolderChange,
  tags,
  onTagsChange,
  settings,
  onSettingsChange,
  sharedTemplateUsage,
  disabled = false,
}: {
  name: string;
  onNameChange: (next: string) => void;
  folders: ContentFolder[];
  folderId: string | null;
  onFolderChange: (next: string | null) => void;
  /** Tag names, not ids — the RPC creates what does not exist and reuses what does. */
  tags: string[];
  onTagsChange: (next: string[]) => void;
  settings: LayoutSettingsDraft;
  /** The page guards this with the shared-Template interruption before applying it. */
  onSettingsChange: (next: LayoutSettingsDraft) => void;
  /** How many Layouts share this geometry; > 1 means an edit here travels. */
  sharedTemplateUsage: number;
  disabled?: boolean;
}) {
  const [vocabulary, setVocabulary] = useState<Tag[]>([]);
  const [draftTag, setDraftTag] = useState("");
  // "Custom" is a mode the operator picks, not a fact derived from whether the stored value
  // happens to match a preset — deriving it hid the inputs when Custom was chosen
  // (the bug LayoutSettingsStep documents).
  const [customMode, setCustomMode] = useState(
    settings.referenceResolution !== null
      && !(RESOLUTION_PRESETS as readonly string[]).includes(settings.referenceResolution),
  );

  useEffect(() => {
    let alive = true;
    fetchTags()
      .then((all) => alive && setVocabulary(all))
      .catch(() => alive && setVocabulary([]));
    return () => {
      alive = false;
    };
  }, []);

  const setResolution = (resolution: string) => {
    const parsed = parseResolution(resolution);
    if (!parsed) return;
    onSettingsChange({
      ...settings,
      referenceResolution: resolution,
      aspectRatio: deriveAspectRatio(parsed[0], parsed[1]),
    });
  };

  const addDraftTag = () => {
    const trimmed = draftTag.trim();
    setDraftTag("");
    if (!trimmed || tags.some((tag) => tag.toLowerCase() === trimmed.toLowerCase())) return;
    onTagsChange([...tags, trimmed]);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Layout Properties</p>

      <label className="flex flex-col gap-1.5">
        <span className={labelClasses}>Layout name</span>
        <input
          value={name}
          disabled={disabled}
          onChange={(event) => onNameChange(event.target.value)}
          className={inputClasses}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelClasses}>Folder</span>
        <select
          value={folderId ?? ""}
          disabled={disabled}
          onChange={(event) => onFolderChange(event.target.value || null)}
          className={inputClasses}
        >
          <option value="">Uncategorized</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-1.5">
        <span className={labelClasses}>Tags</span>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                disabled={disabled}
                onClick={() => onTagsChange(tags.filter((candidate) => candidate !== tag))}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <input
          list="composition-tag-vocabulary"
          value={draftTag}
          disabled={disabled}
          placeholder="Add a tag…"
          onChange={(event) => setDraftTag(event.target.value)}
          onBlur={addDraftTag}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            addDraftTag();
          }}
          className={inputClasses}
        />
        <datalist id="composition-tag-vocabulary">
          {vocabulary.map((tag) => (
            <option key={tag.id} value={tag.name} />
          ))}
        </datalist>
      </div>

      {sharedTemplateUsage > 1 && (
        <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          Resolution and background come from a Template used by {sharedTemplateUsage} Layouts.
          Changing them here changes all of them.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <span className={labelClasses}>Resolution</span>
        <select
          value={customMode ? "custom" : (settings.referenceResolution ?? "")}
          disabled={disabled}
          onChange={(event) => {
            if (event.target.value === "custom") {
              setCustomMode(true);
              return;
            }
            setCustomMode(false);
            setResolution(event.target.value);
          }}
          className={inputClasses}
        >
          {settings.referenceResolution === null && !customMode && (
            <option value="">Choose a resolution…</option>
          )}
          {RESOLUTION_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {preset}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
        {customMode && <CustomResolution disabled={disabled} onCommit={setResolution} />}
        <p className="text-xs text-zinc-400">Aspect ratio: {settings.aspectRatio}</p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={labelClasses}>Background</span>
        <input
          type="color"
          value={settings.background}
          disabled={disabled}
          onChange={(event) => onSettingsChange({ ...settings, background: event.target.value })}
          className="h-10 w-full rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
    </div>
  );
}

function CustomResolution({
  disabled,
  onCommit,
}: {
  disabled: boolean;
  onCommit: (resolution: string) => void;
}) {
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const valid = parseResolution(`${width}x${height}`) !== null;
  const commit = () => valid && onCommit(`${width}x${height}`);

  return (
    <>
      <div className="flex items-center gap-2">
        <input
          type="number" step={1} min={100} max={99999} placeholder="Width" value={width} disabled={disabled}
          onChange={(event) => setWidth(event.target.value)} onBlur={commit} className={inputClasses}
        />
        <span className="text-zinc-400">×</span>
        <input
          type="number" step={1} min={100} max={99999} placeholder="Height" value={height} disabled={disabled}
          onChange={(event) => setHeight(event.target.value)} onBlur={commit} className={inputClasses}
        />
      </div>
      {!valid && (width || height) && (
        <p className="text-xs text-red-600 dark:text-red-400">Width and height must each be 100–99999.</p>
      )}
    </>
  );
}
