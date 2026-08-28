"use client";

import { contentTabs } from "../mock-data";
import type { Campaign } from "../types";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { AssetLibraryStep } from "./AssetLibraryStep";
import { CompositionPicker } from "./CompositionPicker";

export function ContentStep({ campaigns = [] }: { campaigns?: Campaign[] }) {
  const publicationType = usePublicationDraftStore((state) => state.basicInfo.publicationType);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Content</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          {publicationType === "composition"
            ? "เลือก Layout ที่จะเผยแพร่"
            : "เลือกคอนเทนต์และกำหนดรูปแบบสำหรับการเผยแพร่"}
        </p>
      </div>

      {publicationType === "composition" ? (
        <CompositionPicker />
      ) : (
        <>
          <div className="flex items-center gap-6 border-b border-zinc-200">
            {contentTabs.map((tab) => (
              <button
                key={tab.id}
                disabled={!tab.enabled}
                title={!tab.enabled ? "Not built yet" : undefined}
                className={`border-b-2 pb-2.5 text-sm font-medium transition-colors ${
                  tab.enabled
                    ? "border-indigo-600 text-indigo-600"
                    : "cursor-not-allowed border-transparent text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AssetLibraryStep campaigns={campaigns} />
        </>
      )}
    </div>
  );
}
