"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Bell, CheckCircle2, ClipboardList, Clock, Image as ImageIcon, TriangleAlert } from "lucide-react";
import { BellIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

// The Topbar bell, fed by /api/notifications — "things that need you",
// i.e. My Work's real items (Core has no notifications system of its own).
// Read state is per browser: ids the viewer has already seen live in
// localStorage, so the badge counts only items that are new since the last
// time the dropdown was opened. Refetches on open and on window focus, so a
// long-lived tab doesn't sit on a stale count.

type Kind = "approval" | "task" | "draft" | "waiting";

interface NotificationItem {
  id: string;
  kind: Kind;
  title: string;
  dateNote: string;
  href: string;
}

type FeedState = { status: "loading" } | { status: "error" } | { status: "ready"; items: NotificationItem[] };

const SEEN_KEY = "thunderone-seen-notifications";
const SEEN_EVENT = "thunderone-seen-notifications-change";
const MAX_SEEN = 300;
const MAX_LISTED = 8;

const KIND_ICON: Record<Kind, { icon: typeof Bell; tone: string }> = {
  approval: { icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600" },
  task: { icon: ClipboardList, tone: "bg-indigo-50 text-indigo-600" },
  draft: { icon: ImageIcon, tone: "bg-blue-50 text-blue-600" },
  waiting: { icon: Clock, tone: "bg-purple-50 text-purple-600" },
};

function readSeen(): string | null {
  try {
    return window.localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

function parseSeen(raw: string | null): Set<string> {
  try {
    const value = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(value) ? value.filter((id) => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

function markSeen(ids: string[]): void {
  try {
    const merged = [...new Set([...ids, ...parseSeen(readSeen())])].slice(0, MAX_SEEN);
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(merged));
    window.dispatchEvent(new Event(SEEN_EVENT));
  } catch {
    // Storage unavailable — the badge just resets on reload.
  }
}

function subscribeSeen(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(SEEN_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SEEN_EVENT, onChange);
  };
}

async function fetchFeed(): Promise<FeedState> {
  try {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    if (!res.ok) return { status: "error" };
    const body = (await res.json()) as { items?: NotificationItem[]; available?: boolean };
    if (!body.available || !Array.isArray(body.items)) return { status: "error" };
    return { status: "ready", items: body.items };
  } catch {
    return { status: "error" };
  }
}

export function NotificationBell({ variant }: { variant: "default" | "media" }) {
  const [feed, setFeed] = useState<FeedState>({ status: "loading" });
  const [open, setOpen] = useState(false);
  // Ids that were unread at the moment the dropdown opened — still shown
  // with a "new" dot while it stays open, even though they're now marked seen.
  const [newWhileOpen, setNewWhileOpen] = useState<Set<string>>(new Set());
  const seen = parseSeen(useSyncExternalStore(subscribeSeen, readSeen, () => null));

  const refresh = useCallback(async () => {
    const next = await fetchFeed();
    setFeed((prev) => (next.status === "error" && prev.status === "ready" ? prev : next));
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchFeed().then((next) => {
      if (!cancelled) setFeed(next);
    });
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const items = feed.status === "ready" ? feed.items : [];
  const unread = items.filter((item) => !seen.has(item.id));

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setNewWhileOpen(new Set(unread.map((item) => item.id)));
    markSeen(items.map((item) => item.id));
    setOpen(true);
    void refresh();
  }

  const buttonClass =
    variant === "media"
      ? "relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
      : "relative text-[#536999] hover:text-[#071858] dark:text-zinc-400 dark:hover:text-zinc-100";

  return (
    <div className="relative">
      <button
        type="button"
        className={buttonClass}
        aria-label={unread.length > 0 ? `Notifications, ${unread.length} new` : "Notifications"}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={toggle}
      >
        {variant === "media" ? <Bell className="h-4 w-4" /> : <BellIcon className="h-5 w-5" />}
        {unread.length > 0 && (
          <span
            className={`absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-[#fb2c36] px-1 text-[10px] font-medium text-white ${
              variant === "media" ? "-right-0.5 -top-0.5" : "-right-1.5 -top-2"
            }`}
          >
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label="Notifications"
            className="absolute right-0 top-10 z-50 w-80 rounded-lg border border-border bg-popover shadow-float"
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              {feed.status === "ready" && items.length > 0 && (
                <span className="text-xs text-muted-foreground">{items.length} need your attention</span>
              )}
            </div>

            {feed.status === "loading" ? (
              <ul className="flex flex-col gap-3 p-3">
                {[0, 1, 2].map((i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2.5"
                  >
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-3.5 w-48" />
                      <Skeleton className="mt-1.5 h-3 w-24" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : feed.status === "error" ? (
              <EmptyState
                icon={TriangleAlert}
                title="Couldn't load notifications"
                detail="Try again in a moment."
                compact
              />
            ) : items.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="You're all caught up"
                detail="Nothing needs your attention right now."
                compact
              />
            ) : (
              <ul className="max-h-96 overflow-y-auto py-1">
                {items.slice(0, MAX_LISTED).map((item) => {
                  const { icon: Icon, tone } = KIND_ICON[item.kind];
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-accent"
                      >
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tone}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-foreground">{item.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">{item.dateNote}</span>
                        </span>
                        {newWhileOpen.has(item.id) && (
                          <span
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                            aria-label="New"
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            <Link
              href="/my-work"
              onClick={() => setOpen(false)}
              className="block border-t border-border px-3 py-2.5 text-center text-xs font-semibold text-primary hover:bg-accent"
            >
              {items.length > MAX_LISTED ? `View all ${items.length} in My Work` : "Open My Work"}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
