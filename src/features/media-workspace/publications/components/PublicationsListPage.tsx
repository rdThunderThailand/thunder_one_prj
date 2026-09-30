"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlusIcon, UploadIcon } from "@/components/ui/icons";
import { NoAccess } from "@/components/ui/NoAccess";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/lovable/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/lovable/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/lovable/core";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { cn } from "@/lib/utils";
import { LibraryPagination } from "../../content-library/LibraryChrome";
import { fetchChannelGroupOptions, fetchChannels } from "../../channels/services/channels-api";
import {
  cancelPublication,
  deletePublication,
  duplicatePublication,
  fetchPublicationsPage,
  fetchTags,
} from "../services/publications-api";
import type { PublicationListItem, PublicationListParams, PublicationsPage } from "../types";
import { PublicationKpiCards } from "./PublicationKpiCards";
import {
  DEFAULT_FILTERS,
  PublicationsFilterBar,
  type FilterOptions,
  type ListFilters,
} from "./PublicationsFilterBar";
import { PublicationsTable } from "./PublicationsTable";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

type Pending = { action: "delete" | "end"; item: PublicationListItem };

const CONFIRM_COPY = {
  delete: {
    title: "ลบ Program ดราฟต์นี้?",
    body: "ลบแล้วกู้คืนไม่ได้",
    confirm: "ลบ",
  },
  end: {
    title: "จบ Program นี้?",
    body: "Program จะหยุดออกอากาศบนทุก Channel ที่กำหนดไว้ และเริ่มใหม่ไม่ได้ (ทำสำเนาไปสร้างใหม่แทน)",
    confirm: "จบ Program",
  },
} as const;

function toParams(filters: ListFilters, search: string, page: number): PublicationListParams {
  const [targetKind, targetId] = filters.target.split(":");
  return {
    display_status: filters.status === "all" ? undefined : (filters.status as PublicationListParams["display_status"]),
    channel_id: targetKind === "channel" ? targetId : undefined,
    group_id: targetKind === "group" ? targetId : undefined,
    tag_id: filters.tag === "all" ? undefined : filters.tag,
    search,
    sort: filters.sort,
    page,
    limit: PAGE_SIZE,
  };
}

export function PublicationsListPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<ListFilters>(DEFAULT_FILTERS);
  // The box updates `filters.search` at once; the request follows it after a pause.
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);
  const [options, setOptions] = useState<FilterOptions>({ channels: [], groups: [], tags: [] });

  // Result and failure are stamped with the request key they answer, so "loading" is simply
  // "the latest key has no answer yet" and nothing sets state synchronously inside the effect.
  const [result, setResult] = useState<{ key: string; page: PublicationsPage } | null>(null);
  const [failure, setFailure] = useState<{ key: string; error: ClassifiedError } | null>(null);

  const [pending, setPending] = useState<Pending | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const params = useMemo(() => toParams(filters, search, page), [filters, search, page]);
  const requestKey = `${JSON.stringify(params)}#${reloadToken}`;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(filters.search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([fetchChannels(), fetchChannelGroupOptions(), fetchTags()]).then(
      ([channels, groups, tags]) => {
        if (!alive) return;
        // A failed option list only narrows the dropdown; the table still works.
        setOptions({
          channels: channels.status === "fulfilled" ? channels.value : [],
          groups: groups.status === "fulfilled" ? groups.value : [],
          tags: tags.status === "fulfilled" ? tags.value : [],
        });
      },
    );
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    fetchPublicationsPage(params)
      .then((data) => {
        if (!alive) return;
        // The last row of the last page was just deleted/ended: step back instead of showing an empty page.
        if (data.publications.length === 0 && data.total > 0 && params.page && params.page > 1) {
          setPage(Math.ceil(data.total / PAGE_SIZE));
          return;
        }
        setResult({ key: requestKey, page: data });
      })
      .catch((reason) => {
        if (!alive) return;
        setFailure({ key: requestKey, error: classifyApiError(reason, "โหลด Program ไม่สำเร็จ") });
      });
    return () => {
      alive = false;
    };
    // requestKey already encodes params + reloadToken.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const data = result?.page ?? null;
  const error = failure?.key === requestKey ? failure.error : null;
  const isLoading = !error && result?.key !== requestKey;
  const isFiltered =
    filters.search.trim() !== "" || filters.status !== "all" || filters.target !== "all" || filters.tag !== "all";

  const handleFilterChange = (patch: Partial<ListFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    if (!("search" in patch)) setPage(1);
  };

  const runAction = async (item: PublicationListItem, work: () => Promise<void>, fallback: string) => {
    try {
      setBusyId(item.id);
      setActionError(null);
      await work();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : fallback);
    } finally {
      setBusyId(null);
    }
  };

  const handleAction = (action: "duplicate" | "delete" | "end", item: PublicationListItem) => {
    if (action !== "duplicate") {
      setPending({ action, item });
      return;
    }
    void runAction(
      item,
      async () => {
        const res = await duplicatePublication(item.id);
        router.push(`/media-workspace/publications/create?id=${res.publication_id}`);
      },
      "ทำสำเนาไม่สำเร็จ",
    );
  };

  const confirmPending = () => {
    if (!pending) return;
    const { action, item } = pending;
    setPending(null);
    void runAction(
      item,
      async () => {
        await (action === "delete" ? deletePublication(item.id) : cancelPublication(item.id));
        setReloadToken((n) => n + 1);
      },
      action === "delete" ? "ลบไม่สำเร็จ" : "จบ Program ไม่สำเร็จ",
    );
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearch("");
    setPage(1);
  };

  const renderBody = () => {
    if (error) {
      return error.kind === "forbidden" ? (
        <NoAccess message={error.message} />
      ) : (
        <ErrorState
          title="โหลด Program ไม่สำเร็จ"
          description={error.message}
          action={<Button variant="outline" size="sm" onClick={() => setReloadToken((n) => n + 1)}>ลองอีกครั้ง</Button>}
        />
      );
    }
    if (isLoading && !data) return <LoadingState rows={5} />;
    if (!data || data.publications.length === 0) {
      return (
        <EmptyState
          icon={FileText}
          title={isFiltered ? "ไม่พบ Program ที่ตรงกับตัวกรอง" : "ยังไม่มี Program"}
          description={isFiltered ? "ลองเปลี่ยนหรือล้างตัวกรอง" : "สร้าง Program แรกเพื่อเริ่มออกอากาศ"}
          action={
            isFiltered ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>ล้างตัวกรอง</Button>
            ) : (
              <Link href="/media-workspace/publications/create" className={buttonVariants({ size: "sm" })}>Create Program</Link>
            )
          }
        />
      );
    }
    return (
      <div className={cn(isLoading && "opacity-60 transition-opacity")}>
        <PublicationsTable rows={data.publications} busyId={busyId} onAction={handleAction} />
        <LibraryPagination
          page={page}
          totalPages={Math.max(1, Math.ceil(data.total / PAGE_SIZE))}
          total={data.total}
          pageSize={PAGE_SIZE}
          onPage={setPage}
          itemLabel="programs"
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Programs"
        subtitle="จัดการโปรแกรมที่ออกอากาศบนช่องของคุณ"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled title="เร็วๆ นี้" className="gap-1.5">
              <UploadIcon className="h-4 w-4" />
              Import Program
            </Button>
            <Link href="/media-workspace/publications/create" className={cn(buttonVariants(), "gap-1.5")}>
              <PlusIcon className="h-4 w-4" />
              Create Program
            </Link>
          </div>
        }
      />

      <PublicationKpiCards counts={data?.counts_by_status ?? null} />

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <PublicationsFilterBar value={filters} options={options} onChange={handleFilterChange} />
        {actionError && <p className="text-sm text-danger">{actionError}</p>}
        {renderBody()}
      </div>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pending && CONFIRM_COPY[pending.action].title}</AlertDialogTitle>
            <AlertDialogDescription>
              {pending && `${pending.item.name} — ${CONFIRM_COPY[pending.action].body}`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPending}
              className="bg-danger text-danger-foreground hover:bg-danger/90"
            >
              {pending && CONFIRM_COPY[pending.action].confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
