"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ChevronDownIcon, PlusIcon, XIcon } from "@/components/ui/icons";
import type { Campaign, Tag } from "../types";
import {
  languageCode,
  languageOptions,
  priorities,
  publicationTypes,
  type PublicationTypeId,
} from "../mock-data";
import { publicationTypeIcons } from "./publicationTypeIcons";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { PUBLICATION_LIMITS } from "@/config/limits";
import { stripHtmlTags } from "../sanitize";
import { FieldWrapper, DerivedField } from "./basic-info-fields";
import { validateBasicInfo } from "../step-validation";

export interface BasicInfoState {
  campaignId: string;
  publicationType: PublicationTypeId;
  name: string;
  description: string;
  priorityId: string;
  language: string;
  tags: string[];
}

export interface BasicInfoFormProps {
  campaigns?: Campaign[];
  workspaceTags?: Tag[];
  showErrors?: boolean;
}

export function BasicInfoForm({ campaigns = [], workspaceTags = [], showErrors = false }: BasicInfoFormProps) {
  const basicInfo = usePublicationDraftStore((s) => s.basicInfo);
  const setBasicInfo = usePublicationDraftStore((s) => s.setBasicInfo);
  const { campaignId, publicationType, name, description, priorityId, language, tags } = basicInfo;

  const [tagDraft, setTagDraft] = useState("");
  const [addingTag, setAddingTag] = useState(false);
  const assetItems = usePublicationDraftStore((s) => s.assetItems);
  const [pendingType, setPendingType] = useState<PublicationTypeId | null>(null);

  const patch = (next: Partial<BasicInfoState>) => setBasicInfo({ ...basicInfo, ...next });
  const handleTypeClick = (typeId: PublicationTypeId) => {
    if (typeId === publicationType) return;
    if (typeId !== "playlist" && assetItems.length > 1) setPendingType(typeId);
    else patch({ publicationType: typeId });
  };

  const addTag = () => {
    const value = tagDraft.trim();
    if (value && !tags.includes(value)) {
      patch({ tags: [...tags, value] });
    }
    setTagDraft("");
    setAddingTag(false);
  };

  const removeTag = (tag: string) => {
    patch({ tags: tags.filter((t) => t !== tag) });
  };

  const selectedLanguage = languageCode(language);

  const isDescriptionOverLimit = description.length > PUBLICATION_LIMITS.descriptionMaxLength;

  // Recompute on every render so a field's error disappears the instant it becomes valid.
  // An empty list means "not loaded yet" (or the fetch failed), not "no campaign exists" —
  // passing it would flag a perfectly good campaignId as unavailable.
  const campaignCtx = campaigns.length > 0 ? { campaignIds: campaigns.map((c) => c.id) } : undefined;
  const fieldErrors = showErrors ? validateBasicInfo(basicInfo, campaignCtx) : {};

  return (
    <Card className="p-5">
      <h2 className="mb-4 text-base font-semibold text-zinc-900">Basic Information</h2>

      <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <FieldWrapper label="Campaign" required error={fieldErrors.campaignId}>
            <div className="relative">
              <select
                value={campaignId}
                onChange={(e) => patch({ campaignId: e.target.value })}
                aria-invalid={!!fieldErrors.campaignId}
                className={`w-full appearance-none rounded-lg border ${fieldErrors.campaignId ? "border-red-400" : "border-zinc-200"} bg-white py-2.5 pl-3.5 pr-9 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30`}
              >
                <option value="">— Select campaign —</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            </div>
          </FieldWrapper>

          <FieldWrapper label="Publication Name" required error={fieldErrors.name}>
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
                  const nextValue = description.slice(0, start) + sanitized + description.slice(end);
                  patch({ description: nextValue });
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

          <div className="grid grid-cols-2 gap-3">
            <FieldWrapper label="Priority">
              <div className="relative">
                <span
                  className={`pointer-events-none absolute left-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${
                    priorities.find((p) => p.id === priorityId)?.color ?? "bg-emerald-500"
                  }`}
                />
                <select
                  value={priorityId}
                  onChange={(e) => patch({ priorityId: e.target.value })}
                  className="w-full appearance-none rounded-lg border border-zinc-200 bg-white py-2.5 pl-7 pr-9 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                >
                  {priorities.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              </div>
            </FieldWrapper>
            <FieldWrapper label="Language">
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => patch({ language: e.target.value })}
                  className="w-full appearance-none rounded-lg border border-zinc-200 bg-white py-2.5 pl-3.5 pr-9 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                >
                  {languageOptions.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              </div>
            </FieldWrapper>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <FieldWrapper label="Publication Type" required error={fieldErrors.publicationType}>
            <div className="grid grid-cols-3 gap-2.5">
              {publicationTypes.map((type) => {
                const active = publicationType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleTypeClick(type.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors ${
                      active
                        ? "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-400"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <span className={`h-5 w-5 ${active ? "text-indigo-600" : "text-zinc-400"}`}>
                      {publicationTypeIcons[type.id]}
                    </span>
                    <span className="text-xs font-semibold text-zinc-900">{type.label}</span>
                    <span className="text-[11px] text-zinc-400">{type.sublabel}</span>
                  </button>
                );
              })}
            </div>
            {pendingType && (
              <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <span>
                  เปลี่ยนเป็น {publicationTypes.find((t) => t.id === pendingType)?.label} จะเหลือ asset แรกเท่านั้น อีก {assetItems.length - 1} ชิ้นจะถูกเอาออก ดำเนินการต่อ?
                </span>
                <div className="flex shrink-0 gap-2">
                  <Button type="button" variant="secondary" className="px-2.5 py-1 text-xs" onClick={() => setPendingType(null)}>
                    ยกเลิก
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    className="bg-red-600 px-2.5 py-1 text-xs hover:bg-red-500"
                    onClick={() => {
                      patch({ publicationType: pendingType });
                      setPendingType(null);
                    }}
                  >
                    ยืนยัน
                  </Button>
                </div>
              </div>
            )}
          </FieldWrapper>

          <div className="grid grid-cols-2 gap-3">
            <FieldWrapper label="Format">
              <DerivedField value={publicationTypes.find((t) => t.id === publicationType)?.label} />
            </FieldWrapper>
            <FieldWrapper label="Brand">
              <DerivedField value={campaigns.find((c) => c.id === campaignId)?.brand_name} />
            </FieldWrapper>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-zinc-100 pt-4">
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
