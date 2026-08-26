"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useListUrlState } from "@/hooks/use-list-url-state";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NoAccess } from "@/components/ui/NoAccess";
import { Pagination } from "@/components/ui/Pagination";
import { StatTile } from "@/components/ui/StatTile";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { duplicateComposition, fetchCompositions, setCompositionStatus } from "../services/compositions-api";
import { copyName, filterCompositions, paginate, sortCompositions, summarize } from "../list-filtering";
import { describeSaveError } from "../status-display";
import { readListState, writeListState, DEFAULT_STATE } from "../list-url-state";
import type { ListFilters, Sort, SortKey } from "../list-filtering";
import type { CompositionListItem } from "../types";
import { CompositionsFilters } from "./CompositionsFilters";
import { CompositionsTable, type RowAction } from "./CompositionsTable";
import { ListEmpty, ListError, ListSkeleton, SummarySkeleton } from "./CompositionsListStates";

export function CompositionsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initial] = useState(() => readListState(new URLSearchParams(searchParams.toString())));
  const [compositions, setCompositions] = useState<CompositionListItem[] | null>(null);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ListFilters>(initial.filters);
  const [sort, setSort] = useState<Sort>(initial.sort);
  const [page, setPage] = useState(initial.page);
  const [perPage, setPerPage] = useState(initial.perPage);
  const [refreshing, setRefreshing] = useState(false);

  const restore = useCallback(() => {
    const s = readListState(new URLSearchParams(window.location.search));
    setFilters(s.filters);
    setSort(s.sort);
    setPage(s.page);
    setPerPage(s.perPage);
  }, []);
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
    fetchCompositions()
      .then((data) => alive && setCompositions(data))
      .catch((err) => alive && setError(classifyApiError(err, "โหลด Compositions ไม่สำเร็จ")));
    return () => {
      alive = false;
    };
  }, []);

  const reload = () => {
    setRefreshing(true);
    return fetchCompositions()
      .then((data) => {
        setCompositions(data);
        setError(null);
        setRefreshing(false);
      })
      .catch((err) => {
        setError(classifyApiError(err, "โหลด Compositions ไม่สำเร็จ"));
        setRefreshing(false);
      });
  };

  const filtered = filterCompositions(compositions ?? [], filters);
  const sorted = sortCompositions(filtered, sort);
  const { rows, page: currentPage, totalPages } = paginate(sorted, page, perPage);

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

  const handleAction = (action: RowAction, composition: CompositionListItem) => {
    if (action === "edit") {
      router.push(`/media-workspace/compositions/${composition.id}`);
      return;
    }
    if (action === "activate") {
      void runAction(composition.id, () => setCompositionStatus(composition.id, "active"), "เปิดใช้งาน Composition ไม่สำเร็จ");
      return;
    }
    if (action === "deactivate") {
      void runAction(composition.id, () => setCompositionStatus(composition.id, "inactive"), "ปิดใช้งาน Composition ไม่สำเร็จ");
      return;
    }
    void runAction(
      composition.id,
      () => duplicateComposition(composition.id, copyName(composition.name, (compositions ?? []).map((c) => c.name))),
      "คัดลอก Composition ไม่สำเร็จ",
    );
  };

  if (error?.kind === "forbidden") {
    return <NoAccess />;
  }

  const stats = compositions !== null ? summarize(compositions) : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Compositions"
        subtitle="Bind content to each Zone of a Layout and reuse it across publications."
        actions={
          <Link href="/media-workspace/compositions/create" className={buttonClasses("primary")}>
            + New Composition
          </Link>
        }
      />

      {stats === null ? (
        <SummarySkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatTile label="Total Compositions" value={String(stats.total)} />
          <StatTile label="Draft" value={String(stats.draft)} />
          <StatTile label="Active" value={String(stats.active)} color="emerald" />
          <StatTile label="Inactive" value={String(stats.inactive)} />
        </div>
      )}

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-1">
          {refreshing && compositions !== null && (
            <span className="ml-auto text-xs text-zinc-400">กำลังรีเฟรช…</span>
          )}
        </div>

        <CompositionsFilters
          value={filters}
          onClearAll={qs === "" ? undefined : handleClearAll}
          onChange={(next) => {
            setFilters(next);
            setPage(1);
          }}
        />

        {actionError && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{actionError}</p>}

        {error && compositions !== null && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
            <p className="text-sm text-red-500">{error.message}</p>
          </div>
        )}

        {compositions === null && !error ? (
          <ListSkeleton />
        ) : compositions === null && error ? (
          <ListError message={error.message} onRetry={reload} retrying={refreshing} />
        ) : rows.length === 0 ? (
          <ListEmpty
            cause={compositions!.length === 0 ? "no-compositions" : "no-match"}
            onClearFilters={handleClearAll}
          />
        ) : (
          <>
            <CompositionsTable
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
    </div>
  );
}
