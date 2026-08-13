"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { XIcon, PlusIcon } from "@/components/ui/icons";
import type { Campaign, Tag } from "@/types/domain";
import { Field, Select, TextArea, inputClasses } from "./form";
import { usePlaylistDraftStore } from "../store/usePlaylistDraftStore";
import { PLAYLIST_LIMITS } from "../step-validation";
import { PLAYLIST_TYPES } from "../types";

const RESOLUTIONS = [
  { value: "1920x1080", label: "1920 × 1080 (16:9)" },
  { value: "1080x1920", label: "1080 × 1920 (9:16)" },
  { value: "3840x2160", label: "3840 × 2160 (4K)" },
  { value: "1280x720", label: "1280 × 720 (16:9)" },
];

const FRAME_RATES = [24, 25, 30, 60];

export function BasicInfoStep({
  campaigns,
  workspaceTags,
}: {
  campaigns: Campaign[];
  workspaceTags: Tag[];
}) {
  const { name, info, setName, setInfo } = usePlaylistDraftStore();
  const [tagDraft, setTagDraft] = useState("");
  const tags = info.tags ?? [];

  const addTag = (id: string) => {
    if (id && !tags.includes(id)) setInfo({ tags: [...tags, id] });
    setTagDraft("");
  };

  const removeTag = (id: string) => setInfo({ tags: tags.filter((t) => t !== id) });

  const nameLength = name.length;
  const descriptionLength = info.description?.length ?? 0;

  return (
    <Card className="p-5">
      <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
        Playlist Information
      </h2>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Field
          label="Playlist Name"
          required
          hint={`${nameLength} / ${PLAYLIST_LIMITS.nameMax}`}
        >
          <input
            value={name}
            maxLength={PLAYLIST_LIMITS.nameMax}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น KFC Wednesday Main Playlist"
            className={inputClasses}
          />
        </Field>

        <Field label="Campaign" optional>
          <Select
            value={info.campaignId ?? ""}
            placeholder="— Select campaign —"
            options={campaigns.map((c) => ({ value: c.id, label: c.name }))}
            onChange={(e) => setInfo({ campaignId: e.target.value || undefined })}
          />
        </Field>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Field label="Playlist Type">
          <Select
            value={info.playlistType ?? "standard"}
            options={PLAYLIST_TYPES.map((t) => ({
              value: t,
              label: t.charAt(0).toUpperCase() + t.slice(1),
            }))}
            onChange={(e) =>
              setInfo({ playlistType: e.target.value as (typeof PLAYLIST_TYPES)[number] })
            }
          />
        </Field>

        <Field label="Resolution">
          <Select
            value={info.resolution ?? ""}
            options={RESOLUTIONS}
            onChange={(e) => setInfo({ resolution: e.target.value })}
          />
        </Field>

        <Field label="Frame Rate">
          <Select
            value={String(info.frameRate ?? 30)}
            options={FRAME_RATES.map((f) => ({ value: String(f), label: `${f} fps` }))}
            onChange={(e) => setInfo({ frameRate: Number(e.target.value) })}
          />
        </Field>
      </div>

      <Field
        label="Description"
        optional
        className="mt-4"
        hint={`${descriptionLength} / ${PLAYLIST_LIMITS.descriptionMax}`}
      >
        <TextArea
          rows={4}
          value={info.description ?? ""}
          maxLength={PLAYLIST_LIMITS.descriptionMax}
          onChange={(e) => setInfo({ description: e.target.value })}
          placeholder="เพิ่มคำอธิบายสั้นๆ เกี่ยวกับ playlist นี้..."
        />
      </Field>

      <Field label="Tags" optional className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((id) => {
            const label = workspaceTags.find((t) => t.id === id)?.name ?? id;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
              >
                {label}
                <button type="button" onClick={() => removeTag(id)} aria-label={`Remove ${label}`}>
                  <XIcon className="h-3 w-3" />
                </button>
              </span>
            );
          })}

          <div className="relative inline-flex items-center">
            <PlusIcon className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-zinc-400" />
            <select
              value={tagDraft}
              onChange={(e) => addTag(e.target.value)}
              className="appearance-none rounded-full border border-dashed border-zinc-300 bg-transparent py-1 pl-7 pr-3 text-xs text-zinc-500 outline-none dark:border-zinc-700 dark:text-zinc-400"
            >
              <option value="">Add Tag</option>
              {workspaceTags
                .filter((t) => !tags.includes(t.id))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </Field>

      <p className="mt-4 rounded-lg bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
        เลือกภาพหน้าปกได้ในขั้นถัดไป จาก media ที่อยู่ใน playlist นี้ — ถ้าไม่เลือก
        ระบบจะใช้ media ชิ้นแรกแทน
      </p>
    </Card>
  );
}
