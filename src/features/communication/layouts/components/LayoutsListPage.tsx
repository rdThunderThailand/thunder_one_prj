"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { NoAccess } from "@/components/ui/NoAccess";
import { Pagination } from "@/components/ui/Pagination";
import { StatTile } from "@/components/ui/StatTile";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { duplicateLayout, fetchLayouts, setLayoutStatus } from "../services/layouts-api";
import { copyName, filterLayouts, paginate, sortLayouts, summarize } from "../list-filtering";
import { describeSaveError } from "../status-display";
import { readListState, writeListState, DEFAULT_STATE } from "../list-url-state";
import type { ListFilters, Sort, SortKey } from "../list-filtering";
import type { LayoutListItem } from "../types";
import { LayoutsFilters } from "./LayoutsFilters";
import { LayoutsTable, type RowAction } from "./LayoutsTable";
import { ListEmpty, ListError, ListSkeleton, SummarySkeleton } from "./LayoutsListStates";

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

  // Keeps the URL in sync with the view — no setState here, only history, so this
  // effect stays outside the lint rule against synchronous setState in effects.
  useEffect(() => {
    const qs = writeListState({ filters, sort, page, perPage });
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [filters, sort, page, perPage]);

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

  const handleClearFilters = () => {
    setFilters(DEFAULT_STATE.filters);
    setPage(1);
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
      router.push(`/communication/layouts/${layout.id}`);
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
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Layouts"
        subtitle="Design multi-zone screen compositions to use in your publications."
        actions={
          <Link href="/communication/layouts/create" className={buttonClasses("primary")}>
            + New Layout
          </Link>
        }
      />

      {stats === null ? (
        <SummarySkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Total Layouts" value={String(stats.total)} />
          <StatTile label="Active" value={String(stats.active)} color="emerald" />
          <StatTile label="Inactive" value={String(stats.inactive)} />
        </div>
      )}

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-1">
          {/* กำลังรีเฟรช… shown only during a background reload, not initial load */}
          {refreshing && layouts !== null && (
            <span className="ml-auto text-xs text-zinc-400">กำลังรีเฟรช…</span>
          )}
        </div>

        <LayoutsFilters
          value={filters}
          onChange={(next) => {
            setFilters(next);
            setPage(1);
          }}
        />

        {actionError && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{actionError}</p>}

        {error && layouts !== null && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
            <p className="text-sm text-red-500">{error.message}</p>
          </div>
        )}

        {layouts === null && !error ? (
          <ListSkeleton />
        ) : layouts === null && error ? (
          <ListError message={error.message} onRetry={reload} retrying={refreshing} />
        ) : rows.length === 0 ? (
          <ListEmpty
            cause={layouts!.length === 0 ? "no-layouts" : "no-match"}
            onClearFilters={handleClearFilters}
          />
        ) : (
          <>
            <LayoutsTable
              rows={rows}
              busyId={busyId}
              sort={sort}
              onAction={handleAction}
              onSortChange={handleSortChange}
            />
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              perPage={perPage}
              totalItems={sorted.length}
              rangeStart={(currentPage - 1) * perPage + 1}
              rangeEnd={Math.min(currentPage * perPage, sorted.length)}
              onPageChange={setPage}
              onPerPageChange={(next) => {
                setPerPage(next);
                setPage(1);
              }}
            />
          </>
        )}
      </Card>

      <Modal
        open={archiveTarget !== null}
        onClose={() => setArchiveTarget(null)}
        title="Archive Layout"
        footer={
          <>
            <button
              type="button"
              onClick={() => setArchiveTarget(null)}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={confirmArchive}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
            >
              Archive
            </button>
          </>
        }
      >
        <p>
          Archive Layout &ldquo;{archiveTarget?.name}&rdquo;? Layout จะถูกตั้งเป็น Inactive และกู้คืนได้ทีหลัง
          ไม่มีการลบข้อมูล
        </p>
      </Modal>
    </div>
  );
}
