"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { PlusIcon, XIcon } from "@/components/ui/icons";
import type { Tag } from "../types";
import { type PublicationTypeId } from "../mock-data";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { PUBLICATION_LIMITS } from "@/config/limits";
import { stripHtmlTags } from "../sanitize";
import { FieldWrapper } from "./basic-info-fields";
import { validateBasicInfo } from "../step-validation";

export interface BasicInfoState {
  publicationType: PublicationTypeId;
  name: string;
  description: string;
  priorityId: string;
  tags: string[];
}

export interface BasicInfoFormProps {
  workspaceTags?: Tag[];
  showErrors?: boolean;
}

/** Prepare Content — Publication fields. Content type is chosen on Frame 1; every field here
 *  describes the Publication, never the selected Asset (ADR 0072 §4). */
export function BasicInfoForm({ workspaceTags = [], showErrors = false }: BasicInfoFormProps) {
  const basicInfo = usePublicationDraftStore((s) => s.basicInfo);
  const setBasicInfo = usePublicationDraftStore((s) => s.setBasicInfo);
  const { name, description, tags } = basicInfo;

  const [tagDraft, setTagDraft] = useState("");
  const [addingTag, setAddingTag] = useState(false);

  const patch = (next: Partial<BasicInfoState>) => setBasicInfo({ ...basicInfo, ...next });

  const addTag = () => {
    const value = tagDraft.trim();
    if (value && !tags.includes(value)) patch({ tags: [...tags, value] });
    setTagDraft("");
    setAddingTag(false);
  };

  const removeTag = (tag: string) => patch({ tags: tags.filter((t) => t !== tag) });

  const isDescriptionOverLimit = description.length > PUBLICATION_LIMITS.descriptionMaxLength;
  // Recompute on every render so a field's error disappears the instant it becomes valid.
  const fieldErrors = showErrors ? validateBasicInfo(basicInfo) : {};

  return (
    <Card className="p-5">
      <h2 className="mb-4 text-base font-semibold text-zinc-900">Basic Information</h2>

      <div className="flex flex-col gap-4">
        <FieldWrapper label="Program Name" required error={fieldErrors.name}>
          <div className="relative">
            <input
              placeholder="เช่น แคมเปญลดราคาหน้าร้อน 2024"
              maxLength={PUBLICATION_LIMITS.nameMaxLength}
              value={name}
              onChange={(e) => patch({ name: e.target.value })}
              aria-invalid={!!fieldErrors.name}
              className={`w-full rounded-lg border ${fieldErrors.name ? "border-red-400" : "border-zinc-200"} py-2.5 pl-3.5 pr-16 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
              {name.length}/{PUBLICATION_LIMITS.nameMaxLength}
            </span>
          </div>
        </FieldWrapper>

        <FieldWrapper label="Description" optional>
          <div className="relative">
            <textarea
              placeholder="เพิ่มคำอธิบายสั้นๆ เกี่ยวกับ publication นี้..."
              rows={3}
              value={description}
              onChange={(e) => patch({ description: e.target.value })}
              onPaste={(e) => {
                e.preventDefault();
                const pasted = e.clipboardData.getData("text");
                const sanitized = stripHtmlTags(pasted);
                const start = e.currentTarget.selectionStart ?? 0;
                const end = e.currentTarget.selectionEnd ?? 0;
                patch({ description: description.slice(0, start) + sanitized + description.slice(end) });
              }}
              aria-invalid={isDescriptionOverLimit}
              className="w-full resize-none rounded-lg border border-zinc-200 py-2.5 pl-3.5 pr-3.5 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
            <span
              className={`pointer-events-none absolute bottom-2 right-3 text-xs ${
                isDescriptionOverLimit ? "font-medium text-red-600" : "text-zinc-400"
              }`}
            >
              {description.length}/{PUBLICATION_LIMITS.descriptionMaxLength}
            </span>
          </div>
          {isDescriptionOverLimit && (
            <p className="text-xs font-medium text-red-600">
              คำอธิบายยาวเกิน {PUBLICATION_LIMITS.descriptionMaxLength} ตัวอักษร
            </p>
          )}
        </FieldWrapper>

        <FieldWrapper label="Tags" optional>
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove ${tag}`}
                  className="text-zinc-400 hover:text-zinc-700"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
            {addingTag ? (
              <>
                <input
                  autoFocus
                  list="publication-workspace-tags"
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTag()}
                  onBlur={addTag}
                  placeholder="Tag name"
                  className="w-28 rounded-full border border-indigo-300 px-3 py-1 text-xs outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                <datalist id="publication-workspace-tags">
                  {workspaceTags
                    .filter((t) => !tags.includes(t.name))
                    .map((t) => (
                      <option key={t.id} value={t.name} />
                    ))}
                </datalist>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setAddingTag(true)}
                className="flex items-center gap-1 rounded-full border border-dashed border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 hover:border-indigo-300 hover:text-indigo-600"
              >
                <PlusIcon className="h-3 w-3" /> Add tag
              </button>
            )}
          </div>
        </FieldWrapper>
      </div>
    </Card>
  );
}
