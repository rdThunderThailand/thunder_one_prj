"use client";

import { useSyncExternalStore } from "react";

// Per-browser Workspaces launcher preferences (features/workspaces) — which Apps this viewer opened
// recently, and which they pinned. Real usage, but local to this browser
// (Core has no usage/pin store), so it's a convenience, not shared data:
// a new browser or cleared storage starts empty, and every read/write is
// wrapped because storage can be unavailable (private mode, blocked site
// data). Components read it through useSyncExternalStore, so the server
// render and the first client render both see "nothing yet" — no hydration
// mismatch.

const RECENTS_KEY = "thunderone-recent-workspaces";
const PINS_KEY = "thunderone-pinned-workspaces";
const CHANGE_EVENT = "thunderone-workspace-prefs";
const MAX_RECENTS = 8;

export interface RecentWorkspace {
  id: string;
  lastOpenedAt: string;
  openCount: number;
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Storage unavailable — the preference just won't persist.
  }
}

function parseArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** Called by the Sidebar whenever the active App changes. */
export function recordWorkspaceVisit(id: string): void {
  const recents = parseArray<RecentWorkspace>(read(RECENTS_KEY));
  const existing = recents.find((r) => r.id === id);
  const next: RecentWorkspace = {
    id,
    lastOpenedAt: new Date().toISOString(),
    openCount: (existing?.openCount ?? 0) + 1,
  };
  write(RECENTS_KEY, JSON.stringify([next, ...recents.filter((r) => r.id !== id)].slice(0, MAX_RECENTS)));
}

export function useRecentWorkspaces(): RecentWorkspace[] {
  // The snapshot is the raw string (stable between renders); parse after.
  const raw = useSyncExternalStore(subscribe, () => read(RECENTS_KEY), () => null);
  return parseArray<RecentWorkspace>(raw);
}

export function usePinnedWorkspaces(): string[] {
  const raw = useSyncExternalStore(subscribe, () => read(PINS_KEY), () => null);
  return parseArray<string>(raw).filter((id) => typeof id === "string");
}

export function togglePinnedWorkspace(id: string): void {
  const pins = parseArray<string>(read(PINS_KEY));
  write(PINS_KEY, JSON.stringify(pins.includes(id) ? pins.filter((p) => p !== id) : [...pins, id]));
}
