"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CircleCheck, CircleX, Monitor, Timer } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/ui/lovable/core";
import { useListUrlState } from "@/hooks/use-list-url-state";
import { ApiError } from "@/lib/api/api-error";
import { ALL_CHANNELS, type ChannelScope } from "../../channels/channel-scope";
import { todayYmd } from "../../calendar/calendar-day";
import { LibraryEmpty, LibraryPagination, LibraryRowsSkeleton, LibrarySummary, LibrarySummarySkeleton } from "../../content-library/LibraryChrome";
import { downloadPlaybackProofCsv, fetchPlaybackProof, type PlaybackProofEntry, type PlaybackProofResponse, type ProgramFilter } from "../playback-proof-api";
import { rangeBounds, readPlaybackProofUrl, writePlaybackProofUrl, type DateRange, type PlaybackProofUrlState } from "../playback-proof-url";
import { formatAirtime } from "../playback-proof-view";
import { PlaybackProofDrawer } from "./PlaybackProofDrawer";
import { PlaybackProofTable } from "./PlaybackProofTable";
import { PlaybackProofToolbar } from "./PlaybackProofToolbar";

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

export function PlaybackProofPage() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<PlaybackProofUrlState>(() => readPlaybackProofUrl(searchParams));
  // The box shows keystrokes at once; `state.q` (and the request) follows after a pause.
  const [search, setSearch] = useState(state.q);
  const [today] = useState(todayYmd);
  const [loaded, setLoaded] = useState<{ key: string; data: PlaybackProofResponse } | null>(null);
  const [failed, setFailed] = useState<{ key: string; message: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  // The drawer reads the row it was opened from; it is not in the URL, so closing it leaves filters and scroll alone.
  const [selected, setSelected] = useState<PlaybackProofEntry | null>(null);
  // Not opened through a SheetTrigger, so focus is handed back to the row's button by hand on close.
  const openerRef = useRef<HTMLElement | null>(null);

  const qs = writePlaybackProofUrl(state).toString();
  const { from, to } = rangeBounds(state.range, today);
  const key = `${qs}|${from}`;

  useListUrlState(qs, () => {
    const next = readPlaybackProofUrl(new URLSearchParams(window.location.search));
    setState(next);
    setSearch(next.q);
  });

  useEffect(() => {
    if (search === state.q) return;
    const timer = setTimeout(() => setState((current) => ({ ...current, q: search, page: 1 })), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search, state.q]);

  useEffect(() => {
    let alive = true;
    fetchPlaybackProof({ from, to, scope: state.scope, program: state.program, q: state.q, page: state.page, pageSize: PAGE_SIZE })
      .then((data) => {
        if (!alive) return;
        setLoaded({ key, data });
        setFailed(null);
      })
      .catch((error: unknown) => {
        if (!alive) return;
        // A Channel, Group or Program id in the URL that no longer exists (404) or is malformed (400):
        // drop that filter, not the page.
        const isBadFilter = error instanceof ApiError && (error.status === 404 || error.status === 400);
        if (isBadFilter && (state.scope.kind !== "all" || state.program.kind === "program")) {
          setNotice("A filter in the link is invalid or no longer exists, so it was cleared.");
          setState((current) => ({ ...current, scope: ALL_CHANNELS, program: { kind: "all" }, page: 1 }));
          return;
        }
        setFailed({ key, message: "Could not load Playback Proof. Try again in a moment." });
      });
    return () => {
      alive = false;
    };
    // `key` encodes every input of the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const data = loaded?.key === key ? loaded.data : null;
  const error = failed?.key === key ? failed.message : null;
  const kpis = data?.kpis;
  const isFiltered = state.scope.kind !== "all" || state.program.kind !== "all" || state.q !== "";

  const patch = (next: Partial<PlaybackProofUrlState>) => {
    setNotice(null);
    setState((current) => ({ ...current, page: 1, ...next }));
  };

  const exportCsv = () => {
    setNotice(null);
    setIsExporting(true);
    downloadPlaybackProofCsv({ from, to, scope: state.scope, program: state.program, q: state.q })
      // The only 400 the page's own filters can cause is the 50,000-entry cap; the backend text is not shown as is.
      .catch((error: unknown) =>
        setNotice(
          error instanceof ApiError && error.status === 400
            ? "More than 50,000 entries match. Narrow the date range or filters, then export again."
            : "Could not export. Try again in a moment."
        )
      )
      .finally(() => setIsExporting(false));
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Playback Proof"
        subtitle="What each Player reported it played, where, when and for how long."
        titleInTopbar
      />
      {kpis ? (
        <LibrarySummary
          label="Playback Proof summary"
          cards={[
            { label: "Plays", value: kpis.plays, detail: "Slots reported as played", icon: CircleCheck, tone: "text-success bg-success-soft" },
            { label: "Failed", value: kpis.failed, detail: "Slots the Player could not play", icon: CircleX, tone: "text-danger bg-danger-soft" },
            { label: "Airtime", value: formatAirtime(kpis.airtime_seconds), detail: "Total time on screen", icon: Timer, tone: "text-info bg-info-soft" },
            { label: "Screens reporting", value: kpis.screens_reporting, detail: "Channels with at least one entry", icon: Monitor },
          ]}
        />
      ) : (
        <LibrarySummarySkeleton count={4} />
      )}
      <PlaybackProofToolbar
        range={state.range}
        today={today}
        scope={state.scope}
        program={state.program}
        search={search}
        onRange={(range: DateRange) => patch({ range })}
        onScope={(scope: ChannelScope) => patch({ scope })}
        onProgram={(program: ProgramFilter) => patch({ program })}
        onSearch={setSearch}
        onExport={exportCsv}
        isExporting={isExporting}
      />
      {notice && (
        <p
          role="status"
          className="rounded-lg bg-warning-soft px-4 py-3 text-xs text-warning"
        >
          {notice}
        </p>
      )}
      <p className="rounded-lg bg-muted px-4 py-3 text-xs text-muted-foreground">
        Only what Players report appears here. A screen that was off reports nothing, so it shows no entries rather than failures.
      </p>
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-panel">
        {error && <ErrorState description={error} />}
        {!error && !data && (
          <div className="p-5">
            <LibraryRowsSkeleton />
          </div>
        )}
        {data && data.items.length === 0 && (
          <LibraryEmpty
            title={isFiltered ? "No entries match these filters" : "No playback reported in this period"}
            hint={isFiltered ? "Try another Channel, Program or search." : "Players report each item after it plays."}
          />
        )}
        {data && data.items.length > 0 && (
          <>
            <PlaybackProofTable
              items={data.items}
              timeZone={data.display_timezone}
              selectedId={selected?.id ?? null}
              onSelect={(entry, opener) => {
                openerRef.current = opener;
                setSelected(entry);
              }}
            />
            <LibraryPagination
              page={state.page}
              totalPages={Math.max(1, Math.ceil(data.kpis.total / PAGE_SIZE))}
              total={data.kpis.total}
              pageSize={PAGE_SIZE}
              itemLabel="entries"
              onPage={(page) => setState((current) => ({ ...current, page }))}
            />
          </>
        )}
      </section>
      <PlaybackProofDrawer
        entry={selected}
        timeZone={data?.display_timezone ?? "Asia/Bangkok"}
        onClose={() => setSelected(null)}
        onCloseAutoFocus={(event) => {
          if (!openerRef.current) return;
          event.preventDefault();
          openerRef.current.focus();
        }}
      />
    </div>
  );
}
