"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useListUrlState } from "@/hooks/use-list-url-state";
import { PageHeader } from "@/components/layout/PageHeader";
import { Plus } from "lucide-react";
import { NoAccess } from "@/components/ui/NoAccess";
import { Button, buttonVariants } from "@/components/ui/lovable/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/lovable/alert-dialog";
import { LibraryPagination } from "../../content-library/LibraryChrome";
import { LibraryShell } from "../../content-library/LibraryShell";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { duplicateLayout, fetchLayouts, setLayoutStatus } from "../services/layouts-api";
import { copyName, filterLayouts, paginate, sortLayouts, summarize } from "../list-filtering";
import { describeSaveError } from "../status-display";
import { readListState, writeListState, DEFAULT_STATE } from "../list-url-state";
import type { ListFilters, Sort, SortKey } from "../list-filtering";
import type { LayoutListItem } from "../types";
import { LayoutsFilters } from "./LayoutsFilters";
import { LayoutsGrid, LayoutsTable, type RowAction } from "./LayoutsTable";
import { LayoutsSummary, ListEmpty, ListError, ListSkeleton, SummarySkeleton } from "./LayoutsListStates";

export function LayoutsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Read once on mount — the URL is the initial value, not a live subscription, so
  // typing in the search box doesn't fight with the effect that writes it back below.
  const [initial] = useState(() => readListState(new URLSearchParams(searchParams.toString())));
  const [layouts, setLayouts] = useState<LayoutListItem[] | null>(null);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ListFilters>(initial.filters);
  const [sort, setSort] = useState<Sort>(initial.sort);
  const [page, setPage] = useState(initial.page);
  const [perPage, setPerPage] = useState(initial.perPage);
  const [refreshing, setRefreshing] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<LayoutListItem | null>(null);
  const [isGrid, setIsGrid] = useState(false);

  // Keeps the URL in sync with the view (push/replace decided by useListUrlState — a
  // search-typing run collapses into one history step) and restores filters/sort/page
  // from window.location on Back/Forward.
  const restore = useCallback(() => {
    const s = readListState(new URLSearchParams(window.location.search));
    setFilters(s.filters);
    setSort(s.sort);
    setPage(s.page);
    setPerPage(s.perPage);
  }, []);
  // An empty query string is exactly the "everything is at its default" signal, so it
  // doubles as the test for whether "Clear all" would do anything.
  const qs = writeListState({ filters, sort, page, perPage });
  useListUrlState(qs, restore);

  const handleSortChange = (key: SortKey) => {
    setSort((current) => {
      if (current.key === key) return { key, dir: current.dir === "asc" ? "desc" : "asc" };
      return { key, dir: key === "updated" ? "desc" : "asc" };
    });
    setPage(1);
  };

  useEffect(() => {
    let alive = true;
    fetchLayouts()
      .then((data) => alive && setLayouts(data))
      .catch((err) => alive && setError(classifyApiError(err, "โหลด Layouts ไม่สำเร็จ")));
    return () => {
      alive = false;
    };
  }, []);

  // Keeps current rows on failure — retry preserves filters/sort/page since they live
  // in component state reload() never touches.
  const reload = () => {
    setRefreshing(true);
    return fetchLayouts()
      .then((data) => {
        setLayouts(data);
        setError(null);
        setRefreshing(false);
      })
      .catch((err) => {
        setError(classifyApiError(err, "โหลด Layouts ไม่สำเร็จ"));
        setRefreshing(false);
      });
  };

  const filtered = filterLayouts(layouts ?? [], filters);
  const sorted = sortLayouts(filtered, sort);
  // paginate() clamps the page itself, so narrowing a filter can never strand the view.
  const { rows, page: currentPage, totalPages } = paginate(sorted, page, perPage);

  // Resets sort and paging alongside the filters: the button says "Clear all", and its
  // promise is that the view — and the URL — come back to their pristine state.
  const handleClearAll = () => {
    setFilters(DEFAULT_STATE.filters);
    setSort(DEFAULT_STATE.sort);
    setPage(DEFAULT_STATE.page);
    setPerPage(DEFAULT_STATE.perPage);
  };

  const runAction = async (id: string, run: () => Promise<unknown>, fallback: string) => {
    setActionError(null);
    setBusyId(id);
    try {
      await run();
      await reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setActionError(message.startsWith("Invalid input:") ? describeSaveError(message) : classifyApiError(err, fallback).message);
    } finally {
      setBusyId(null);
    }
  };

  const handleAction = (action: RowAction, layout: LayoutListItem) => {
    if (action === "edit") {
      router.push(`/media-workspace/layouts/templates/${layout.id}`);
      return;
    }
    if (action === "archive") {
      setArchiveTarget(layout);
      return;
    }
    if (action === "restore") {
      void runAction(layout.id, () => setLayoutStatus(layout.id, "active"), "กู้คืน Layout ไม่สำเร็จ");
      return;
    }
    void runAction(
      layout.id,
      () => duplicateLayout(layout.id, copyName(layout.name, (layouts ?? []).map((l) => l.name))),
      "คัดลอก Layout ไม่สำเร็จ"
    );
  };

  const confirmArchive = () => {
    if (!archiveTarget) return;
    const target = archiveTarget;
    setArchiveTarget(null);
    void runAction(target.id, () => setLayoutStatus(target.id, "inactive"), "เก็บ Layout ไม่สำเร็จ");
  };

  if (error?.kind === "forbidden") {
    return <NoAccess />;
  }

  // Stats are derived only when data is available — never show 0/0/0 during load.
  const stats = layouts !== null ? summarize(layouts) : null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Templates"
        subtitle="Create and manage reusable Zone geometry for Layouts."
        titleInTopbar
        actions={<Link href="/media-workspace/layouts/templates/create" className={buttonVariants({ size: "sm" })}><Plus className="h-3.5 w-3.5" />New Template</Link>}
      />

      {stats === null ? <SummarySkeleton count={3} /> : <LayoutsSummary stats={stats} />}

      <LibraryShell
        toolbar={
          <>
            <LayoutsFilters value={filters} isGrid={isGrid} onViewChange={setIsGrid} onClearAll={qs === "" ? undefined : handleClearAll} onChange={(next) => { setFilters(next); setPage(1); }} />
            {refreshing && layouts !== null && <span className="ml-auto text-[10px] text-muted-foreground">กำลังรีเฟรช…</span>}
          </>
        }
        title="All Templates"
        meta={layouts === null ? "…" : `${sorted.length.toLocaleString()} templates`}
        footer={rows.length > 0 && (
          <LibraryPagination page={currentPage} totalPages={totalPages} total={sorted.length} pageSize={perPage} onPage={setPage} itemLabel="templates" perPageOptions={[10, 25, 50]} onPageSize={(next) => { setPerPage(next); setPage(1); }} />
        )}
      >
        {actionError && <p className="mb-3 text-[10px] text-danger">{actionError}</p>}
        {error && layouts !== null && (
          <div className="mb-3 rounded-lg border border-danger/30 bg-danger-soft p-3">
            <p className="text-[10px] text-danger">{error.message}</p>
          </div>
        )}
        {layouts === null && !error ? (
          <ListSkeleton />
        ) : layouts === null && error ? (
          <ListError message={error.message} onRetry={reload} retrying={refreshing} />
        ) : rows.length === 0 ? (
          <ListEmpty cause={layouts!.length === 0 ? "no-layouts" : "no-match"} onClearFilters={handleClearAll} />
        ) : isGrid ? (
          <LayoutsGrid rows={rows} busyId={busyId} onAction={handleAction} />
        ) : (
          <LayoutsTable rows={rows} busyId={busyId} sort={sort} onAction={handleAction} onSortChange={handleSortChange} />
        )}
      </LibraryShell>

      <AlertDialog open={archiveTarget !== null} onOpenChange={(open) => { if (!open) setArchiveTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Layout</AlertDialogTitle>
            <AlertDialogDescription>
              Archive Layout &ldquo;{archiveTarget?.name}&rdquo;? Layout จะถูกตั้งเป็น Inactive และกู้คืนได้ทีหลัง ไม่มีการลบข้อมูล
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button className="bg-danger hover:bg-danger" onClick={confirmArchive}>Archive</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
