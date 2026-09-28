"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Image as ImageIcon, LayoutGrid, Loader2, MonitorPlay, Search, TriangleAlert, User } from "lucide-react";
import { SearchIcon } from "@/components/ui/icons";
import { matchPages } from "./search-index";

// The Topbar's search: the search bar opens a command palette (also ⌘K /
// Ctrl+K from anywhere). Pages match instantly from the nav config
// (search-index.ts); people, Media files and channels come from
// /api/search, debounced, with the previous request aborted on every
// keystroke. ↑/↓ move, Enter opens, Esc closes.

interface Hit {
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

type GroupKey = "pages" | "people" | "media" | "channels";

const GROUPS: { key: GroupKey; label: string; icon: typeof Search }[] = [
  { key: "pages", label: "หน้า", icon: LayoutGrid },
  { key: "people", label: "บุคลากร", icon: User },
  { key: "media", label: "ไฟล์ใน Media Library", icon: FileText },
  { key: "channels", label: "Channels", icon: MonitorPlay },
];

type Remote = { status: "idle" } | { status: "loading" } | { status: "error" } | {
  status: "done";
  people: Hit[] | null;
  media: Hit[] | null;
  channels: Hit[] | null;
};

const MIN_REMOTE_CHARS = 2;
const DEBOUNCE_MS = 250;

function useRemoteSearch(query: string): Remote {
  const [remote, setRemote] = useState<Remote>({ status: "idle" });
  const q = query.trim();

  useEffect(() => {
    if (q.length < MIN_REMOTE_CHARS) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setRemote({ status: "loading" });
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal, cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const body = await res.json();
        setRemote({ status: "done", people: body.people ?? null, media: body.media ?? null, channels: body.channels ?? null });
      } catch (err) {
        if ((err as Error).name !== "AbortError") setRemote({ status: "error" });
      }
    }, DEBOUNCE_MS);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [q]);

  return q.length < MIN_REMOTE_CHARS ? { status: "idle" } : remote;
}

function GroupIcon({ group, hit }: { group: GroupKey; hit: Hit }) {
  if (group === "media" && hit.subtitle.startsWith("รูปภาพ")) return <ImageIcon className="h-4 w-4" />;
  const Icon = GROUPS.find((g) => g.key === group)?.icon ?? Search;
  return <Icon className="h-4 w-4" />;
}

export function GlobalSearch({ variant }: { variant: "default" | "media" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const remote = useRemoteSearch(query);

  // ⌘K / Ctrl+K from anywhere in the app.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const groups = useMemo(() => {
    const pages = matchPages(query).map((p) => ({ id: p.href, title: p.title, subtitle: p.context, href: p.href }));
    const byKey: Record<GroupKey, Hit[]> = {
      pages,
      people: remote.status === "done" ? (remote.people ?? []) : [],
      media: remote.status === "done" ? (remote.media ?? []) : [],
      channels: remote.status === "done" ? (remote.channels ?? []) : [],
    };
    return GROUPS.map((g) => ({ ...g, hits: byKey[g.key] })).filter((g) => g.hits.length > 0);
  }, [query, remote]);

  const flat = groups.flatMap((g) => g.hits.map((hit) => ({ group: g.key, hit })));
  // Each group's first row index in `flat`, for keyboard selection.
  const offsets = groups.map((_, gi) => groups.slice(0, gi).reduce((sum, g) => sum + g.hits.length, 0));
  const activeIndex = Math.min(active, Math.max(flat.length - 1, 0));

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (flat.length === 0) return;
      const next = (activeIndex + (event.key === "ArrowDown" ? 1 : -1) + flat.length) % flat.length;
      setActive(next);
      listRef.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter" && flat[activeIndex]) {
      event.preventDefault();
      go(flat[activeIndex].hit.href);
    }
  }

  const trimmed = query.trim();
  const searching = remote.status === "loading";
  const nothingFound = trimmed.length > 0 && flat.length === 0 && !searching && (trimmed.length < MIN_REMOTE_CHARS || remote.status === "done");

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <Dialog.Trigger asChild>
        {variant === "media" ? (
          <button
            type="button"
            className="relative mx-auto hidden h-9 w-full max-w-md items-center rounded-lg border border-border bg-card pl-9 pr-14 text-left text-xs text-muted-foreground hover:border-primary/40 md:flex"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            ค้นหาทุกอย่างใน ThunderOne...
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">⌘ K</kbd>
          </button>
        ) : (
          <button
            type="button"
            className="flex h-9 w-full max-w-[700px] items-center gap-2.5 rounded-lg bg-[#eff5ff] px-3 text-left hover:bg-[#e6effd] dark:bg-zinc-900"
          >
            <SearchIcon className="h-4 w-4 shrink-0 text-[#6074a9] dark:text-zinc-500" />
            <span className="w-full text-xs text-[#6074a9] dark:text-zinc-500">ค้นหาทุกอย่างใน ThunderOne...</span>
            <kbd className="shrink-0 text-xs text-[#6074a9] dark:text-zinc-500">⌘ K</kbd>
          </button>
        )}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-popover shadow-float"
        >
          <Dialog.Title className="sr-only">ค้นหาใน ThunderOne</Dialog.Title>
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onInputKeyDown}
              placeholder="ค้นหาหน้า บุคลากร ไฟล์ หรือ channel..."
              aria-label="ค้นหา"
              role="combobox"
              aria-expanded={flat.length > 0}
              aria-controls="global-search-results"
              aria-activedescendant={flat[activeIndex] ? `global-search-${activeIndex}` : undefined}
              className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {searching && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
          </div>

          <div
            ref={listRef}
            id="global-search-results"
            role="listbox"
            className="max-h-[60vh] overflow-y-auto py-2"
          >
            {trimmed.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                พิมพ์เพื่อค้นหาหน้า บุคลากร ไฟล์ใน Media Library หรือ channel
              </p>
            )}

            {groups.map((group, gi) => (
              <div
                key={group.key}
                role="group"
                aria-label={group.label}
                className="py-1"
              >
                <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{group.label}</p>
                {group.hits.map((hit, hi) => {
                  const i = offsets[gi] + hi;
                  return (
                    <button
                      key={`${group.key}-${hit.id}`}
                      id={`global-search-${i}`}
                      data-index={i}
                      type="button"
                      role="option"
                      aria-selected={i === activeIndex}
                      onMouseMove={() => setActive(i)}
                      onClick={() => go(hit.href)}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-left ${i === activeIndex ? "bg-accent" : ""}`}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                        <GroupIcon
                          group={group.key}
                          hit={hit}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-foreground">{hit.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{hit.subtitle}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}

            {trimmed.length > 0 && searching && flat.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">กำลังค้นหา...</p>
            )}
            {nothingFound && (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">ไม่พบผลลัพธ์สำหรับ “{trimmed}”</p>
            )}
            {remote.status === "error" && (
              <p className="flex items-center justify-center gap-1.5 px-4 py-3 text-xs text-muted-foreground">
                <TriangleAlert className="h-3.5 w-3.5" />
                ค้นหาข้อมูลจากระบบไม่สำเร็จ แสดงเฉพาะผลลัพธ์หน้า
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
            <span>↑↓ เลือก</span>
            <span>Enter เปิด</span>
            <span>Esc ปิด</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
