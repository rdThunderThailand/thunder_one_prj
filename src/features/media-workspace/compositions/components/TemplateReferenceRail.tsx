"use client";

import { LayoutWireframe } from "@/features/media-workspace/layouts/components/LayoutWireframe";
import type { LayoutListItem } from "@/features/media-workspace/layouts/types";

export function TemplateReferenceRail({
  templates,
  selectedId,
  onSelect,
  onStartBlank,
}: {
  templates: LayoutListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onStartBlank: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-3" aria-label="Templates">
      <button
        type="button"
        onClick={onStartBlank}
        aria-pressed={selectedId === null}
        className={`flex w-36 flex-col gap-2 rounded-lg border border-dashed p-3 text-left transition-colors ${
          selectedId === null ? "border-primary bg-primary-soft" : "border-border hover:border-primary/30"
        }`}
      >
        <span className="flex h-20 items-center justify-center rounded border border-border text-xs text-muted-foreground">Blank</span>
        <span className="text-xs font-medium text-foreground">Start blank</span>
      </button>
      {templates.map((template) => {
        const selected = template.id === selectedId;
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            aria-pressed={selected}
            className={`flex w-36 flex-col gap-2 rounded-lg border p-3 text-left transition-colors ${
              selected
                ? "border-primary bg-primary-soft"
                : "border-border hover:border-primary/30"
            }`}
          >
            <LayoutWireframe
              zones={template.zones}
              background={template.background}
              aspectRatio={template.aspect_ratio}
              shouldShowLabels={false}
              className="h-20 w-full rounded border border-border"
            />
            <span className="text-xs font-medium text-foreground">{template.name}</span>
          </button>
        );
      })}
      {templates.length === 0 && <p className="text-sm text-muted-foreground">ไม่มี Template ที่พร้อมใช้งาน</p>}
    </div>
  );
}
