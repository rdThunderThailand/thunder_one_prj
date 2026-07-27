"use client";

import { useState } from "react";
import {
  PRIORITIES,
  PUBLICATION_TYPES,
  type BasicInfoForm,
  type Campaign,
  type Tag,
} from "../types";

type BasicInfoStepProps = {
  form: BasicInfoForm;
  onChange: (updates: Partial<BasicInfoForm>) => void;
  campaigns: Campaign[];
  existingTags: Tag[];
};

export function BasicInfoStep({
  form,
  onChange,
  campaigns,
  existingTags,
}: BasicInfoStepProps) {
  const [tagInput, setTagInput] = useState("");

  const currentTags = form.tags || [];

  const handleAddTag = (tagName: string) => {
    const trimmed = tagName.trim();
    if (!trimmed) return;

    const isDuplicate = currentTags.some(
      (t) => t.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) return;

    onChange({ tags: [...currentTags, trimmed] });
    setTagInput("");
  };

  const handleRemoveTag = (indexToRemove: number) => {
    onChange({
      tags: currentTags.filter((_, idx) => idx !== indexToRemove),
    });
  };

  const handleKeyDownTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  return (
    <div className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Basic Information
      </h2>

      {/* Campaign */}
      <div className="space-y-1.5">
        <label
          htmlFor="campaign-select"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Campaign
        </label>
        <select
          id="campaign-select"
          value={form.campaign_id || ""}
          onChange={(e) => onChange({ campaign_id: e.target.value })}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="">— Unassigned —</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Publication Name */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <label htmlFor="pub-name">
            Publication Name <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-zinc-500 font-mono">
            {(form.name || "").length}/100
          </span>
        </div>
        <input
          id="pub-name"
          type="text"
          maxLength={100}
          value={form.name || ""}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Enter publication name..."
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <label htmlFor="pub-description">Description</label>
          <span className="text-xs text-zinc-500 font-mono">
            {(form.description || "").length}/300
          </span>
        </div>
        <textarea
          id="pub-description"
          rows={3}
          maxLength={300}
          value={form.description || ""}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Optional publication description..."
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* Priority & Language Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Priority */}
        <div className="space-y-1.5">
          <label
            htmlFor="priority-select"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Priority
          </label>
          <select
            id="priority-select"
            value={form.priority || "normal"}
            onChange={(e) =>
              onChange({ priority: e.target.value as BasicInfoForm["priority"] })
            }
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 capitalize focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Language */}
        <div className="space-y-1.5">
          <label
            htmlFor="language-select"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Language
          </label>
          <select
            id="language-select"
            value={form.language || ""}
            onChange={(e) => onChange({ language: e.target.value })}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">— Select language —</option>
            <option value="th">Thai</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {/* Publication Type */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Publication Type
        </label>
        <div className="flex flex-wrap gap-2">
          {PUBLICATION_TYPES.map((type) => {
            const isSelected = (form.publication_type || "playlist") === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onChange({ publication_type: type })}
                className={`rounded-md px-3.5 py-1.5 text-sm font-medium capitalize transition-colors border ${
                  isSelected
                    ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                    : "bg-zinc-50 text-zinc-700 border-zinc-300 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700"
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label
          htmlFor="tag-input"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Tags
        </label>

        {/* Selected Tag Chips */}
        {currentTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {currentTags.map((tag, idx) => (
              <span
                key={`${tag}-${idx}`}
                className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(idx)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  aria-label={`Remove tag ${tag}`}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input & Add Button */}
        <div className="flex gap-2">
          <input
            id="tag-input"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDownTagInput}
            placeholder="Type tag name and press Enter..."
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={() => handleAddTag(tagInput)}
            className="rounded-md bg-zinc-100 px-3.5 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700"
          >
            Add tag
          </button>
        </div>

        {/* Existing Tags Suggestions */}
        {existingTags.length > 0 && (
          <div className="pt-2">
            <span className="text-xs text-zinc-500 block mb-1.5">
              Suggested tags:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {existingTags.map((t) => {
                const isAlreadyAdded = currentTags.some(
                  (cur) => cur.toLowerCase() === t.name.toLowerCase()
                );
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={isAlreadyAdded}
                    onClick={() => handleAddTag(t.name)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors ${
                      isAlreadyAdded
                        ? "bg-zinc-100 text-zinc-400 border-zinc-200 opacity-60 cursor-not-allowed dark:bg-zinc-850 dark:text-zinc-500 dark:border-zinc-800"
                        : "bg-zinc-50 text-zinc-700 border-zinc-300 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700"
                    }`}
                  >
                    + {t.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
