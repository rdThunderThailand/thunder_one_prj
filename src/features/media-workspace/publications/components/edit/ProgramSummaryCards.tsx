"use client";

import { useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { fetchPlaylist } from "@/features/media-workspace/playlists";
import { fetchComposition } from "@/features/media-workspace/compositions/services/compositions-api";
import { DEFAULT_TIMEZONE, WEEKDAYS, formatMonthDays, utcToZonedParts } from "../../schedule";
import { compositionContent, playlistContent, type ProgramContent, type ProgramEditState } from "../../program-edit";
import type { ChannelListItem } from "../../../channels/types";
import type { PublicationSchedule, PublicationTarget } from "../../types";
import { CompositionPickerModal } from "../CompositionPickerModal";
import { PlaylistPickerModal } from "../PlaylistPickerModal";
import { ChangeTargetModal } from "./ChangeTargetModal";
import { EditCard } from "./EditCard";

// ponytail: Edit Schedule is FE-E — its button renders disabled until that modal exists.
const COMING_SOON = "เร็วๆ นี้";

// Frame 03 lists the week Mon → Sun; WEEKDAYS is Sun-first to match Postgres DOW.
const MONDAY_FIRST = [...WEEKDAYS.slice(1), WEEKDAYS[0]];

function ChangeButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={!onClick}
      title={onClick ? undefined : COMING_SOON}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

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
  const isLayout = content.type === "composition";
  const kind = isLayout ? "Layout" : content.type === "playlist" ? "Playlist" : content.type;
  const [picking, setPicking] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);

  // Video / image Programs carry their items directly; switching type or editing items is not offered here.
  const canChange = content.type === "playlist" || isLayout;

  const select = (id: string) => {
    setPicking(false);
    setChangeError(null);
    const next = isLayout
      ? fetchComposition(id).then(compositionContent)
      : fetchPlaylist(id).then(playlistContent);
    next.then(onChange).catch(() => setChangeError(`Could not load that ${kind}. Try again.`));
  };

  return (
    <EditCard
      step="2. Content Source *"
      hint="เลือก Playlist หรือ Layout อย่างใดอย่างหนึ่ง ในการแสดงผล Program นี้"
      error={error ?? changeError ?? undefined}
    >
      <div className="flex items-center justify-between gap-4 rounded-lg border border-primary/40 bg-primary/5 p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium capitalize text-muted-foreground">{kind}</p>
          <p className="truncate text-sm font-semibold text-foreground">{content.name ?? "—"}</p>
          {!isLayout && content.items.length > 0 && (
            <p className="text-xs text-muted-foreground">{content.items.length} items</p>
          )}
        </div>
        <ChangeButton
          label={isLayout ? "Change Layout" : "Change Playlist"}
          onClick={canChange ? () => setPicking(true) : undefined}
        />
      </div>
      {picking && isLayout && (
        <CompositionPickerModal selectedId={content.compositionId} onClose={() => setPicking(false)} onSelect={select} />
      )}
      {picking && !isLayout && (
        <PlaylistPickerModal selectedId={content.playlistId} onClose={() => setPicking(false)} onSelect={select} />
      )}
    </EditCard>
  );
}

export function TargetCard({
  state,
  channels,
  error,
  onChange,
}: {
  state: ProgramEditState;
  channels: ChannelListItem[];
  error?: string;
  onChange: (targets: PublicationTarget[]) => void;
}) {
  const { targets } = state;
  const [picking, setPicking] = useState(false);
  const channelCount = targets.filter((t) => t.target_type === "channel").length;
  const groups = targets.filter((t) => t.target_type === "group").length;
  const summary = [
    channelCount > 0 && `${channelCount} Channel${channelCount > 1 ? "s" : ""}`,
    groups > 0 && `${groups} Group${groups > 1 ? "s" : ""}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <EditCard
      step="3. Target *"
      hint="กำหนด Channel หรือ Channel Group ที่ต้องการแสดง Program นี้"
      error={error}
    >
      <p className="text-sm font-semibold text-foreground">{summary || "No target"}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {targets.map((t) => t.name).filter(Boolean).join(", ")}
      </p>
      <div className="mt-3">
        <ChangeButton
          label="Change Target"
          onClick={() => setPicking(true)}
        />
      </div>
      {picking && (
        <ChangeTargetModal
          targets={targets}
          channels={channels}
          onClose={() => setPicking(false)}
          onApply={(next) => {
            setPicking(false);
            onChange(next);
          }}
        />
      )}
    </EditCard>
  );
}

function describe(schedule: PublicationSchedule): { title: string; time: string; days: number[] } {
  const zone = schedule.timezone || DEFAULT_TIMEZONE;
  const start = utcToZonedParts(schedule.starts_at, zone);
  const end = schedule.ends_at ? utcToZonedParts(schedule.ends_at, zone) : null;
  const range = end ? `${start.date} – ${end.date}` : `From ${start.date} · no end date`;
  const rule = schedule.recurrence as { freq?: string; days?: number[]; month_days?: number[]; daily_start?: string; daily_end?: string };

  if (rule.freq === "weekly") {
    return { title: range, time: `${rule.daily_start} – ${rule.daily_end}`, days: rule.days ?? [] };
  }
  if (rule.freq === "monthly") {
    return {
      title: `${formatMonthDays(rule.month_days ?? [])} · ${range}`,
      time: `${rule.daily_start} – ${rule.daily_end}`,
      days: [],
    };
  }
  // One-time: the window is the whole range, so the times belong next to their dates.
  const from = `${start.date} ${start.time}`;
  return { title: end ? `${from} – ${end.date} ${end.time}` : `From ${from} · no end date`, time: "", days: [] };
}

export function ScheduleCard({ state, error }: { state: ProgramEditState; error?: string }) {
  const schedule = state.schedule;
  const view = schedule ? describe(schedule) : null;

  return (
    <EditCard
      step="4. Schedule *"
      hint="กำหนดช่วงเวลาออกอากาศของ Program นี้"
      error={error}
    >
      {view ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">{view.title}</p>
              {view.time && <p className="text-xs text-muted-foreground">{view.time}</p>}
            </div>
            <ChangeButton label="Edit Schedule" />
          </div>
          {view.days.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {MONDAY_FIRST.map((day) => (
                <span
                  key={day.value}
                  className={
                    view.days.includes(day.value)
                      ? "rounded-md bg-info-soft px-2.5 py-1 text-xs font-medium text-info"
                      : "rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                  }
                >
                  {day.label}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Not scheduled</p>
      )}
    </EditCard>
  );
}
