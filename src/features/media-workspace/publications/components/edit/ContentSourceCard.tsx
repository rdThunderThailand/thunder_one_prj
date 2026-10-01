"use client";

import { useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { fetchPlaylist, formatDuration } from "@/features/media-workspace/playlists";
import { fetchComposition } from "@/features/media-workspace/compositions/services/compositions-api";
import { compositionContent, playlistContent, type ProgramContent, type ProgramEditState } from "../../program-edit";
import { CompositionPickerModal } from "../CompositionPickerModal";
import { PlaylistPickerModal } from "../PlaylistPickerModal";
import { EditCard } from "./EditCard";
import { ContentPicture } from "./ProgramContentThumb";
import { useContentSummary, type ContentSummary } from "./use-content-summary";

type Kind = "playlist" | "composition";

const OPTIONS: { kind: Kind; label: string; hint: string }[] = [
  { kind: "playlist", label: "Playlist", hint: "เลือก Playlist เพื่อเล่นสื่อแบบต่อเนื่อง" },
  { kind: "composition", label: "Layout", hint: "เลือก Layout ที่กำหนดรูปแบบการแสดงผล" },
];

function metaLine(summary: ContentSummary | null, fallbackCount: number): string {
  if (summary?.kind === "layout") {
    const zones = `${summary.zones.length} zone${summary.zones.length === 1 ? "" : "s"}`;
    return summary.resolution ? `${summary.resolution} · ${zones}` : zones;
  }
  const count = summary?.itemCount ?? fallbackCount;
  const items = `${count} item${count === 1 ? "" : "s"}`;
  return summary?.kind === "asset" && summary.durationSeconds ? `${items} | Total ${formatDuration(summary.durationSeconds)}` : items;
}

/** Frame 03: the bound Playlist / Layout with its picture, size and tags. */
function BoundContent({ content }: { content: ProgramContent }) {
  const { summary } = useContentSummary(content);
  return (
    <div className="flex min-w-0 gap-3">
      <ContentPicture
        summary={summary}
        name={content.name}
        className="w-28 shrink-0 self-start"
        isCompact
      />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="truncate text-sm font-semibold text-foreground">{content.name ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{metaLine(summary, content.items.length)}</p>
        {summary && summary.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {summary.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Frame 03 "Content Source": a Playlist | Layout pair. The bound one is selected; the other offers a
 * picker, and picking there switches the Program's type (the backend clears the other id). Nothing
 * changes until something is picked. Video / image Programs show their items and may switch too.
 */
export function ContentSourceCard({
  state,
  error,
  onChange,
}: {
  state: ProgramEditState;
  error?: string;
  onChange: (content: ProgramContent) => void;
}) {
  const { content } = state;
  const [picking, setPicking] = useState<Kind | null>(null);
  const [changeError, setChangeError] = useState<string | null>(null);
  const isMedia = content.type !== "playlist" && content.type !== "composition";

  const select = (kind: Kind, id: string) => {
    setPicking(null);
    setChangeError(null);
    const next = kind === "composition" ? fetchComposition(id).then(compositionContent) : fetchPlaylist(id).then(playlistContent);
    next.then(onChange).catch(() => setChangeError(`Could not load that ${kind === "composition" ? "Layout" : "Playlist"}. Try again.`));
  };

  return (
    <EditCard
      step="2. Content Source *"
      hint="เลือก Playlist หรือ Layout อย่างใดอย่างหนึ่ง ในการแสดงผล Program นี้"
      error={error ?? changeError ?? undefined}
    >
      {isMedia && (
        <p className="mb-3 rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm text-foreground">
          <span className="font-semibold capitalize">{content.type}</span> · {content.items.length} item
          {content.items.length === 1 ? "" : "s"} — pick a Playlist or Layout below to replace them.
        </p>
      )}
      <div
        role="radiogroup"
        aria-label="Content Source"
        className="grid gap-3 md:grid-cols-2"
      >
        {OPTIONS.map((option) => {
          const isOn = content.type === option.kind;
          return (
            <div
              key={option.kind}
              role="radio"
              aria-checked={isOn}
              aria-label={option.label}
              className={`flex flex-col gap-3 rounded-lg border p-4 ${isOn ? "border-primary/40 bg-primary/5" : "border-border"}`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${isOn ? "border-[5px] border-primary" : "border-border"}`} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.hint}</p>
                </div>
              </div>
              {isOn && <BoundContent content={content} />}
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setPicking(option.kind)}
              >
                {isOn ? `Change ${option.label}` : `Use a ${option.label}`}
              </Button>
            </div>
          );
        })}
      </div>
      {picking === "composition" && (
        <CompositionPickerModal
          selectedId={content.compositionId}
          onClose={() => setPicking(null)}
          onSelect={(id) => select("composition", id)}
        />
      )}
      {picking === "playlist" && (
        <PlaylistPickerModal
          selectedId={content.playlistId}
          onClose={() => setPicking(null)}
          onSelect={(id) => select("playlist", id)}
        />
      )}
    </EditCard>
  );
}
