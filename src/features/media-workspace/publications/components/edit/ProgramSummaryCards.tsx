"use client";

import { useState } from "react";
import { CalendarClock, Clock3, Radio, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/lovable/button";
import { DEFAULT_TIMEZONE, WEEKDAYS, formatMonthDays, utcToZonedParts } from "../../schedule";
import type { ProgramEditState } from "../../program-edit";
import type { ChannelListItem } from "../../../channels/types";
import type { PublicationSchedule, PublicationTarget } from "../../types";
import { reachedChannels, selectionFromTargets } from "../../target-picker";
import { ChangeTargetModal } from "./ChangeTargetModal";
import { ChannelAvatars } from "./ChannelAvatars";
import { EditScheduleModal } from "./EditScheduleModal";
import { EditCard } from "./EditCard";

const COMING_SOON = "เร็วๆ นี้";

// Frame 03 lists the week Mon → Sun; WEEKDAYS is Sun-first to match Postgres DOW.
const MONDAY_FIRST = [...WEEKDAYS.slice(1), WEEKDAYS[0]];

function ChangeButton({ label, disabled, onClick }: { label: string; disabled?: boolean; onClick?: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="shrink-0 text-primary"
      disabled={disabled || !onClick}
      title={onClick || disabled ? undefined : COMING_SOON}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

/** Frame 03's bordered tile beside a card's summary line. */
function SummaryTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-card text-primary">
      <Icon className="h-4 w-4" strokeWidth={1.8} />
    </span>
  );
}

export function TargetCard({
  state,
  channels,
  disabled,
  error,
  onChange,
}: {
  state: ProgramEditState;
  channels: ChannelListItem[];
  disabled?: boolean;
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
      icon={Radio}
      hint="กำหนด Channel หรือ Channel Group ที่ต้องการแสดง Program นี้"
      error={error}
    >
      <div className="flex items-center gap-3">
        <SummaryTile icon={Radio} />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">{summary || "No target"}</p>
          <p className="truncate text-[10px] text-muted-foreground">
            {targets.map((t) => t.name).filter(Boolean).join(", ")}
          </p>
        </div>
      </div>
      <ChannelAvatars channels={reachedChannels(channels, selectionFromTargets(targets))} />
      <div className="mt-3">
        <ChangeButton
          label="Change Target"
          disabled={disabled}
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

function describe(schedule: PublicationSchedule): { title: string; time: string; range: string; days: number[] } {
  const zone = schedule.timezone || DEFAULT_TIMEZONE;
  const start = utcToZonedParts(schedule.starts_at, zone);
  const end = schedule.ends_at ? utcToZonedParts(schedule.ends_at, zone) : null;
  const range = end ? `${start.date} – ${end.date}` : `From ${start.date} · No end date`;
  const rule = schedule.recurrence as {
    freq?: string;
    days?: number[];
    month_days?: number[];
    dates?: string[];
    daily_start?: string;
    daily_end?: string;
  };

  if (rule.freq === "weekly") {
    const days = rule.days ?? [];
    return { title: days.length === 7 ? "Every day" : "Weekly", time: `${rule.daily_start} – ${rule.daily_end}`, range, days };
  }
  if (rule.freq === "dates") {
    const count = rule.dates?.length ?? 0;
    return {
      title: `${count} custom date${count === 1 ? "" : "s"}`,
      time: `${rule.daily_start} – ${rule.daily_end}`,
      range,
      days: [],
    };
  }
  if (rule.freq === "monthly") {
    return {
      title: formatMonthDays(rule.month_days ?? []),
      time: `${rule.daily_start} – ${rule.daily_end}`,
      range,
      days: [],
    };
  }
  // One-time: the window is the whole range, so the times belong next to their dates.
  const from = `${start.date} ${start.time}`;
  return { title: "One time", time: "", range: end ? `${from} – ${end.date} ${end.time}` : `From ${from} · No end date`, days: [] };
}

export function ScheduleCard({
  state,
  disabled,
  error,
  onChange,
}: {
  state: ProgramEditState;
  disabled?: boolean;
  error?: string;
  onChange: (schedule: PublicationSchedule) => void;
}) {
  const schedule = state.schedule;
  const view = schedule ? describe(schedule) : null;
  const [editing, setEditing] = useState(false);
  const editButton = (
    <ChangeButton
      label="Edit Schedule"
      disabled={disabled}
      onClick={() => setEditing(true)}
    />
  );

  return (
    <EditCard
      step="4. Schedule *"
      icon={CalendarClock}
      hint="กำหนดช่วงเวลาออกอากาศของ Program นี้"
      error={error}
    >
      {view ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <SummaryTile icon={Clock3} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground">{view.title}</p>
              {view.time && <p className="text-[10px] text-muted-foreground">{view.time}</p>}
              <p className="text-[10px] text-muted-foreground">{view.range}</p>
            </div>
            {editButton}
          </div>
          {view.days.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {MONDAY_FIRST.map((day) => (
                <span
                  key={day.value}
                  className={
                    view.days.includes(day.value)
                      ? "rounded-md bg-info-soft px-2.5 py-1 text-[10px] font-medium text-info"
                      : "rounded-md bg-muted px-2.5 py-1 text-[10px] text-muted-foreground"
                  }
                >
                  {day.label}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <SummaryTile icon={Clock3} />
          <p className="flex-1 text-xs text-muted-foreground">Not scheduled</p>
          {editButton}
        </div>
      )}
      {editing && (
        <EditScheduleModal
          schedule={schedule}
          playlistId={state.content.type === "playlist" ? state.content.playlistId : null}
          programName={state.name}
          onClose={() => setEditing(false)}
          onApply={(next) => {
            setEditing(false);
            onChange(next);
          }}
        />
      )}
    </EditCard>
  );
}
