"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ChevronDownIcon, PlusIcon, XIcon } from "@/components/ui/icons";
import type { Campaign } from "../types";
import { priorities, publicationTypes, type PublicationTypeId } from "../mock-data";
import { publicationTypeIcons } from "./publicationTypeIcons";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";

interface FieldWrapperProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  children: ReactNode;
}

function FieldWrapper({ label, required, optional, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-zinc-700">
        {label} {required && <span className="text-red-500">*</span>}
        {optional && <span className="text-zinc-400">(Optional)</span>}
      </label>
      {children}
    </div>
  );
}

function FieldSelect({
  children,
  disabled,
}: {
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        disabled={disabled}
        className="w-full appearance-none rounded-lg border border-zinc-200 bg-white py-2.5 pl-3.5 pr-9 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
    </div>
  );
}

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
}

export function BasicInfoForm({ campaigns = [] }: BasicInfoFormProps) {
  const basicInfo = usePublicationDraftStore((s) => s.basicInfo);
  const setBasicInfo = usePublicationDraftStore((s) => s.setBasicInfo);
  const cancelDraft = usePublicationDraftStore((s) => s.cancelDraft);
  const { campaignId, publicationType, name, description, priorityId, language, tags } = basicInfo;

  const [tagDraft, setTagDraft] = useState("");
  const [addingTag, setAddingTag] = useState(false);

  const patch = (next: Partial<BasicInfoState>) => setBasicInfo({ ...basicInfo, ...next });

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

  const selectedLanguage = language === "Thai" ? "th" : language === "English" ? "en" : language;

  return (
    <Card className="p-5">
      <h2 className="mb-4 text-base font-semibold text-zinc-900">Basic Information</h2>

      <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <FieldWrapper label="Campaign" required>
            <div className="relative">
              <select
                value={campaignId}
                onChange={(e) => patch({ campaignId: e.target.value })}
                className="w-full appearance-none rounded-lg border border-zinc-200 bg-white py-2.5 pl-3.5 pr-9 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
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

          <FieldWrapper label="Publication Name" required>
            <div className="relative">
              <input
                placeholder={name}
                maxLength={100}
                onChange={(e) => patch({ name: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 py-2.5 pl-3.5 pr-16 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                {name.length}/100
              </span>
            </div>
          </FieldWrapper>

          <FieldWrapper label="Description" optional>
            <div className="relative">
              <textarea
                placeholder={description}
                maxLength={300}
                rows={3}
                onChange={(e) => patch({ description: e.target.value })}
                className="w-full resize-none rounded-lg border border-zinc-200 py-2.5 pl-3.5 pr-3.5 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              />
              <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-zinc-400">
                {description.length}/300
              </span>
            </div>
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
                  <option value="th">Thai</option>
                  <option value="en">English</option>
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              </div>
            </FieldWrapper>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <FieldWrapper label="Publication Type" required>
            <div className="grid grid-cols-3 gap-2.5">
              {publicationTypes.map((type) => {
                const active = publicationType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => patch({ publicationType: type.id })}
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
          </FieldWrapper>

          <div className="grid grid-cols-2 gap-3">
            <FieldWrapper label="Format">
              <FieldSelect disabled>
                <option>All Formats</option>
              </FieldSelect>
            </FieldWrapper>
            <FieldWrapper label="Brand">
              <FieldSelect disabled>
                <option>All Brands</option>
              </FieldSelect>
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
              <input
                autoFocus
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTag()}
                onBlur={addTag}
                placeholder="Tag name"
                className="w-28 rounded-full border border-indigo-300 px-3 py-1 text-xs outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
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

      <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
        <Link href="/" onClick={() => cancelDraft()}>
          <Button variant="secondary">Cancel</Button>
        </Link>
      </div>
    </Card>
  );
}
