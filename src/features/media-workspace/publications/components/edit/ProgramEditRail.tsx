"use client";

import { useEffect, useState } from "react";
import { CheckIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/lovable/select";
import { Badge } from "@/components/ui/lovable/badge";
import { fetchNowNext, type NowNextRow } from "../../now-next";
import { DEFAULT_TIMEZONE, utcToZonedParts } from "../../schedule";
import { DISPLAY_STATUS_LABELS } from "../../publication-list-display";
import type { ProgramEditState } from "../../program-edit";
import { PRIORITIES, type Priority, type PublicationDetail, type PublicationDisplayStatus } from "../../types";

const STATUS_VARIANT = {
  draft: "info",
  publishing: "warning",
  scheduled: "info",
  live: "success",
  ended: "neutral",
} as const;

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  const { date, time } = utcToZonedParts(iso, DEFAULT_TIMEZONE);
  return `${date} ${time}`;
}

function StatusCard({
  status,
  channelCount,
  unpublished,
}: {
  status: PublicationDisplayStatus;
  channelCount: number;
  unpublished: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <h2 className="mb-3 text-base font-semibold text-foreground">Program Status</h2>
      <Badge
        variant={STATUS_VARIANT[status]}
        className="px-3 py-1.5 text-sm"
      >
        {DISPLAY_STATUS_LABELS[status]}
      </Badge>
      {status === "live" && (
        <p className="mt-2 text-sm text-muted-foreground">
          Playing on {channelCount} channel{channelCount === 1 ? "" : "s"}
        </p>
      )}
      {unpublished && status !== "draft" && status !== "ended" && (
        <p className="mt-3 rounded-lg bg-info-soft px-3 py-2 text-xs text-info">
          Changes will be applied after publishing. Current playback will continue until the new
          schedule takes effect.
        </p>
      )}
      {status === "ended" && (
        <p className="mt-3 text-xs text-muted-foreground">
          This Program has ended and cannot be edited. Duplicate it to air it again.
        </p>
      )}
    </div>
  );
}

/** Next hour on one Channel, from Now & Next — what is on screen now and what follows (ADR 0065). */
function PlaybackPreview({ state }: { state: ProgramEditState }) {
  const channelTargets = state.targets.filter((t) => t.target_type === "channel" && t.channel_id);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [rows, setRows] = useState<NowNextRow[] | null>(null);
  const selected = channelId ?? channelTargets[0]?.channel_id ?? null;

  useEffect(() => {
    let alive = true;
    fetchNowNext(60, false)
      .then((res) => {
        if (alive) setRows(res.rows);
      })
      .catch(() => {
        if (alive) setRows([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const row = rows?.find((r) => r.channel?.id === selected) ?? null;
  const occurrences = row ? [row.current, ...row.upcoming].filter((o) => o !== null) : [];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <h2 className="mb-3 text-base font-semibold text-foreground">
        Playback Preview <span className="text-xs font-normal text-muted-foreground">(Next 1 Hour)</span>
      </h2>
      {channelTargets.length > 0 ? (
        <Select
          value={selected ?? undefined}
          onValueChange={setChannelId}
        >
          <SelectTrigger className="mb-3 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {channelTargets.map((t) => (
              <SelectItem
                key={t.channel_id}
                value={t.channel_id as string}
              >
                {t.name ?? t.channel_id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="text-xs text-muted-foreground">Preview follows a Channel target.</p>
      )}
      {rows === null && <p className="text-xs text-muted-foreground">Loading…</p>}
      {rows !== null && channelTargets.length > 0 && occurrences.length === 0 && (
        <p className="text-xs text-muted-foreground">Nothing scheduled on this Channel in the next hour.</p>
      )}
      <ul className="flex flex-col gap-2">
        {occurrences.map((o) => {
          const open = utcToZonedParts(o.opens_at, DEFAULT_TIMEZONE).time;
          const close = o.closes_at ? utcToZonedParts(o.closes_at, DEFAULT_TIMEZONE).time : "";
          return (
            <li
              key={o.occurrence_id}
              className="flex items-baseline gap-3 text-sm"
            >
              <span className="w-24 shrink-0 text-xs text-muted-foreground">
                {open}{close && ` – ${close}`}
              </span>
              <span className="truncate text-foreground">
                {o.publications.map((p) => p.name).join(", ")}
              </span>
              {o.scheduled_now && <Badge variant="success">NOW</Badge>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{children}</span>
    </div>
  );
}

function ProgramInformation({
  detail,
  state,
  disabled,
  onPriority,
}: {
  detail: PublicationDetail;
  state: ProgramEditState;
  disabled: boolean;
  onPriority: (priority: Priority) => void;
}) {
  const [copied, setCopied] = useState(false);
  const shortId = detail.id.slice(0, 8);

  const copy = () => {
    navigator.clipboard
      .writeText(detail.id)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => undefined);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <h2 className="mb-2 text-base font-semibold text-foreground">Program Information</h2>
      <InfoRow label="Program ID">
        <span className="inline-flex items-center gap-1.5 font-mono text-xs">
          {shortId}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Copy Program ID"
            onClick={copy}
          >
            {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <span className="text-xs">Copy</span>}
          </Button>
        </span>
      </InfoRow>
      <InfoRow label="Priority">
        <Select
          value={state.priority}
          disabled={disabled}
          onValueChange={(value) => onPriority(value as Priority)}
        >
          <SelectTrigger className="h-8 w-32 capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((p) => (
              <SelectItem
                key={p}
                value={p}
                className="capitalize"
              >
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </InfoRow>
      <InfoRow label="Created by">{detail.created_by?.display_name ?? "—"}</InfoRow>
      <InfoRow label="Created on">{formatDateTime(detail.created_at)}</InfoRow>
      <InfoRow label="Last updated">{formatDateTime(detail.updated_at)}</InfoRow>
    </div>
  );
}

export function ProgramEditRail({
  detail,
  state,
  status,
  isDirty,
  readOnly,
  onPriority,
}: {
  detail: PublicationDetail;
  state: ProgramEditState;
  status: PublicationDisplayStatus;
  isDirty: boolean;
  readOnly: boolean;
  onPriority: (priority: Priority) => void;
}) {
  return (
    <aside className="flex flex-col gap-4">
      <StatusCard
        status={status}
        channelCount={state.targets.filter((t) => t.target_type === "channel").length}
        unpublished={isDirty}
      />
      <PlaybackPreview state={state} />
      <ProgramInformation
        detail={detail}
        state={state}
        disabled={readOnly}
        onPriority={onPriority}
      />
    </aside>
  );
}

