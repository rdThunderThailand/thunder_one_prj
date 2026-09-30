"use client";

import { useState } from "react";
import { XIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/lovable/input";
import { Label } from "@/components/ui/lovable/label";
import { Textarea } from "@/components/ui/lovable/textarea";
import { PUBLICATION_LIMITS } from "@/config/limits";
import type { ProgramEditState } from "../../program-edit";
import { EditCard } from "./EditCard";

export function ProgramDetailsCard({
  state,
  disabled,
  error,
  onChange,
}: {
  state: ProgramEditState;
  disabled: boolean;
  error?: string;
  onChange: (change: Partial<ProgramEditState>) => void;
}) {
  const [tagDraft, setTagDraft] = useState("");

  const addTag = () => {
    const tag = tagDraft.trim();
    setTagDraft("");
    if (tag && !state.tags.includes(tag)) onChange({ tags: [...state.tags, tag] });
  };

  return (
    <EditCard
      step="1. Program Details"
      error={error}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="program-name">
            Program Name <span className="text-danger">*</span>
          </Label>
          <Input
            id="program-name"
            value={state.name}
            maxLength={PUBLICATION_LIMITS.nameMaxLength}
            disabled={disabled}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="program-description">Description</Label>
          <Textarea
            id="program-description"
            rows={3}
            value={state.description}
            maxLength={PUBLICATION_LIMITS.descriptionMaxLength}
            disabled={disabled}
            onChange={(event) => onChange({ description: event.target.value })}
          />
          <p className="text-right text-xs text-muted-foreground">
            {state.description.length} / {PUBLICATION_LIMITS.descriptionMaxLength}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="program-tag">Tags</Label>
          <div className="flex flex-wrap items-center gap-2">
            {state.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-md bg-info-soft px-2 py-1 text-xs font-medium text-info"
              >
                {tag}
                {!disabled && (
                  <button
                    type="button"
                    aria-label={`Remove tag ${tag}`}
                    onClick={() => onChange({ tags: state.tags.filter((t) => t !== tag) })}
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
            {!disabled && (
              <Input
                id="program-tag"
                className="h-8 w-40"
                placeholder="+ Add tag"
                value={tagDraft}
                onChange={(event) => setTagDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  addTag();
                }}
                onBlur={addTag}
              />
            )}
          </div>
        </div>
      </div>
    </EditCard>
  );
}
