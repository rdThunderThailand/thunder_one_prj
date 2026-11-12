"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/lovable/button";
import { Pagination } from "@/components/ui/Pagination";
import { PlusIcon } from "@/components/ui/icons";
import { AccessDeniedState, EmptyState, NotFoundState } from "../states/states";
import { ErrorState } from "../states/ErrorState";
import { useListUrlState } from "../list-page/useListUrlState";
import type { AssignmentRead } from "../../services/asset-assignments-api";
import type { AssignmentHistoryEvent, AssignmentHistoryPage } from "../../services/asset-assignments-contract";
import { assignmentEventKey, assignmentHistoryQueryString, type AssignmentHistoryQuery } from "../../domain/assignment-history";
import { assignmentErrorText } from "./assignment-error-text";
import { AssignmentsWorkspace } from "./AssignmentsWorkspace";
import { AssignmentsResults } from "./AssignmentsResults";
import { AssignmentsTabs } from "./AssignmentsTabs";
import { AssignmentsHistoryFilters } from "./AssignmentsHistoryFilters";
import { AssignmentsHistoryLoading } from "./AssignmentsHistoryLoading";
import { AssignmentsHistoryTable } from "./AssignmentsHistoryTable";
import { AssignmentsHistoryPanel } from "./AssignmentsHistoryPanel";

export function AssignmentsHistoryView({ result, query, filtered }: {
  result: AssignmentRead<AssignmentHistoryPage>;
  query: AssignmentHistoryQuery;
  filtered: boolean;
}) {
  const url = useListUrlState();
  const router = useRouter();
  const [refreshing, refresh] = useTransition();
  const busy = url.isPending || refreshing;
  const source = assignmentHistoryQueryString(query);
  const [selection, setSelection] = useState<{ source: string; key: string } | null>(null);
  if (selection && (selection.source !== source || url.isPending)) setSelection(null);
  const opener = useRef<HTMLElement | null>(null);
  const page = result.ok ? result.data : null;
  const selected = page?.data.find((event) => selection?.source === source && assignmentEventKey(event) === selection.key);
  function select(event: AssignmentHistoryEvent, element: HTMLElement) {
    opener.current = element;
    setSelection({ source, key: assignmentEventKey(event) });
  }
  function close() {
    setSelection(null);
    opener.current?.focus({ preventScroll: true });
  }
  const code = result.ok ? null : result.code;
  const copy = assignmentErrorText(code ?? "");
  const retry = <Button variant="outline" onClick={() => router.refresh()}>Retry</Button>;
  if (code === "PERMISSION_DENIED") return <AccessDeniedState {...copy} />;
  if (code === "UNAUTHENTICATED") return <EmptyState {...copy} />;
  if (code === "NOT_FOUND") return <NotFoundState {...copy} action={retry} />;
  const hasRows = Boolean(page?.data.length);
  const firstPage = `/asset-workspace/assignments?tab=history&${assignmentHistoryQueryString({ ...query, page: 1 })}`;
  let content;
  if (url.isPending) content = <AssignmentsHistoryLoading />;
  else if (code === "VALIDATION") {
    content = (
      <EmptyState {...copy} action={(
        <Button asChild variant="outline">
          <Link href="/asset-workspace/assignments?tab=history">Clear filters</Link>
        </Button>
      )} />
    );
  } else if (!result.ok) content = <ErrorState {...copy} />;
  else if (!hasRows && result.data.total > 0) {
    content = (
      <EmptyState title="No assignment history on this page" body="Go to the first page to see the latest assignment events."
        action={(
          <Button asChild variant="outline">
            <Link href={firstPage}>Go to first page</Link>
          </Button>
        )} />
    );
  } else if (!hasRows) {
    content = (
      <EmptyState title={filtered ? "No matching assignment history" : "No assignment history"}
        body={filtered ? "Try another search or clear the filters." : "Assignment events appear here after assets are assigned, transferred or returned."}
        action={filtered ? (
          <Button asChild variant="outline">
            <Link href="/asset-workspace/assignments?tab=history">Clear filters</Link>
          </Button>
        ) : undefined} />
    );
  } else if (page) {
    content = (
      <AssignmentsHistoryTable rows={page.data} page={page.page} pageSize={page.pageSize}
        selectedKey={selected ? assignmentEventKey(selected) : undefined} onSelect={select} />
    );
  }
  return (
    <AssignmentsWorkspace>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Assignments" subtitle="View current asset assignments, custodians and locations." />
        <Button asChild variant="primary" size="sm" className="max-sm:h-10">
          <Link href="/asset-workspace/assignments/assign">
            <PlusIcon aria-hidden="true" className="size-4" />
            Assign Asset
          </Link>
        </Button>
      </div>
      <AssignmentsTabs url={url} />
      <AssignmentsHistoryFilters url={url} />
      <AssignmentsResults busy={busy} tab="history" scrollKey={source} aside={selected && page ? (
        <AssignmentsHistoryPanel event={selected} expiresAt={page.expiresAt} onClose={close}
          onRefresh={() => refresh(() => router.refresh())} refreshing={refreshing} />
      ) : null} footer={page && hasRows ? (
        <Pagination page={page.page} totalPages={page.totalPages} perPage={page.pageSize}
          perPageOptions={[...new Set([10, 25, 50, page.pageSize])].sort((a, b) => a - b)} totalItems={page.total}
          rangeStart={(page.page - 1) * page.pageSize + 1} rangeEnd={Math.min(page.page * page.pageSize, page.total)}
          itemLabel="assignment history records" onPageChange={(value) => url.set({ page: String(value) })}
          onPerPageChange={(value) => url.set({ pageSize: String(value) })} />
      ) : undefined}>
        {busy || hasRows ? content : <div className="p-4">{content}</div>}
      </AssignmentsResults>
    </AssignmentsWorkspace>
  );
}
