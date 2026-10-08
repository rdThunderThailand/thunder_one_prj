import { readChannelScope, writeChannelScope, type ChannelScope } from "../channels/channel-scope.ts";
import { shiftYmd } from "../publications/schedule.ts";
import type { ProgramFilter } from "./playback-proof-api.ts";

export const RANGE_PRESETS = ["today", "yesterday", "7d", "30d"] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];
export type DateRange = { kind: "preset"; preset: RangePreset } | { kind: "custom"; from: string; to: string };

export type PlaybackProofUrlState = {
  range: DateRange;
  scope: ChannelScope;
  program: ProgramFilter;
  q: string;
  page: number;
};

export const MAX_RANGE_DAYS = 92;
const DEFAULT_PRESET: RangePreset = "7d";
export const DEFAULT_RANGE: DateRange = { kind: "preset", preset: DEFAULT_PRESET };

// ponytail: fixed +07:00 like the Calendar — Asia/Bangkok has no DST (ADR 0085 §2).
const OFFSET = "+07:00";

const isYmd = (value: string | null): value is string => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value;
};

const daysBetween = (from: string, to: string) => (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;

/** Inclusive local days a range covers. */
export function rangeDays(range: DateRange, today: string): { from: string; to: string } {
  if (range.kind === "custom") return { from: range.from, to: range.to };
  if (range.preset === "today") return { from: today, to: today };
  if (range.preset === "yesterday") return { from: shiftYmd(today, -1), to: shiftYmd(today, -1) };
  return { from: shiftYmd(today, range.preset === "7d" ? -6 : -29), to: today };
}

/** The offset datetimes the API takes: local midnight of the first day to local midnight after the last. */
export function rangeBounds(range: DateRange, today: string): { from: string; to: string } {
  const days = rangeDays(range, today);
  return { from: `${days.from}T00:00:00${OFFSET}`, to: `${shiftYmd(days.to, 1)}T00:00:00${OFFSET}` };
}

/** A custom range is valid when both days parse, run forwards, and span at most 92 days (ADR 0089 §7). */
export function isValidCustomRange(from: string, to: string): boolean {
  if (!isYmd(from) || !isYmd(to)) return false;
  const span = daysBetween(from, to);
  return span >= 0 && span + 1 <= MAX_RANGE_DAYS;
}

function readRange(params: URLSearchParams): DateRange {
  const from = params.get("from");
  const to = params.get("to");
  if (from && to) return isValidCustomRange(from, to) ? { kind: "custom", from, to } : DEFAULT_RANGE;
  const preset = params.get("range");
  return RANGE_PRESETS.includes(preset as RangePreset) ? { kind: "preset", preset: preset as RangePreset } : DEFAULT_RANGE;
}

function readProgram(params: URLSearchParams): ProgramFilter {
  const program = params.get("program");
  if (!program) return { kind: "all" };
  return program === "unattributed" ? { kind: "unattributed" } : { kind: "program", id: program };
}

export function readPlaybackProofUrl(params: URLSearchParams): PlaybackProofUrlState {
  const page = Number(params.get("page"));
  return {
    range: readRange(params),
    scope: readChannelScope(params),
    program: readProgram(params),
    q: params.get("q") ?? "",
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

/** Defaults (last 7 days, everything, page 1) stay out of the URL so the bare route is the default view. */
export function writePlaybackProofUrl(state: PlaybackProofUrlState): URLSearchParams {
  const params = writeChannelScope(state.scope, new URLSearchParams());
  if (state.range.kind === "custom") {
    params.set("from", state.range.from);
    params.set("to", state.range.to);
  } else if (state.range.preset !== DEFAULT_PRESET) {
    params.set("range", state.range.preset);
  }
  if (state.program.kind === "unattributed") params.set("program", "unattributed");
  if (state.program.kind === "program") params.set("program", state.program.id);
  if (state.q) params.set("q", state.q);
  if (state.page > 1) params.set("page", String(state.page));
  return params;
}
