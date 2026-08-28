"use client";

import { Card } from "@/components/ui/Card";
import { ImageIcon } from "@/components/ui/icons";
import { languageLabel, priorities, publicationTypes } from "../mock-data";
import type { Campaign } from "../types";
import { publicationTypeIcons } from "./publicationTypeIcons";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import type { MediaAsset } from "@/types/domain";
import { PublicationPlaybackPreviewButton } from "./PublicationPlaybackPreviewButton";

export function PreviewPanel({ campaigns = [], assets = [] }: { campaigns?: Campaign[]; assets?: MediaAsset[] }) {
  const state = usePublicationDraftStore((s) => s.basicInfo);
  const campaign = campaigns.find((c) => c.id === state.campaignId);
  const type = publicationTypes.find((t) => t.id === state.publicationType);
  const priority = priorities.find((p) => p.id === state.priorityId);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900">Preview</h2>
        <PublicationPlaybackPreviewButton assets={assets} />
      </div>

      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-zinc-400">
        <ImageIcon className="h-8 w-8" />
        <p className="text-xs">Content preview will appear here</p>
      </div>

      <dl className="mt-5 space-y-3 border-t border-zinc-100 pt-4 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-zinc-500">Campaign</dt>
          <dd className="font-medium text-zinc-900">{campaign?.name}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-zinc-500">Publication Type</dt>
          <dd className="flex items-center gap-1.5 text-right font-medium text-zinc-900">
            <span className="h-4 w-4 text-zinc-500">{type && publicationTypeIcons[type.id]}</span>
            <span>
              {type?.label}
              <span className="block text-xs font-normal text-zinc-400">{type?.sublabel}</span>
            </span>
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-zinc-500">Priority</dt>
          <dd className="flex items-center gap-1.5 font-medium text-zinc-900">
            <span className={`h-2 w-2 rounded-full ${priority?.color}`} />
            {priority?.label}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="shrink-0 text-zinc-500">Tags</dt>
          <dd className="text-right font-medium text-zinc-900">{state.tags.join(", ") || "—"}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-zinc-500">Language</dt>
          <dd className="font-medium text-zinc-900">{languageLabel(state.language)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-zinc-500">Brand</dt>
          <dd className="font-medium text-zinc-900">{campaign?.brand_name ?? "—"}</dd>
        </div>
      </dl>
    </Card>
  );
}
