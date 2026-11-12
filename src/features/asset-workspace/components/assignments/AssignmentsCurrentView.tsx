"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/lovable/button";
import { Pagination } from "@/components/ui/Pagination";
import { PlusIcon } from "@/components/ui/icons";
import type { ListData } from "../list-page/AssetWorkspaceListPage";
import { AssignmentsWorkspace } from "./AssignmentsWorkspace";
import { useListUrlState } from "../list-page/useListUrlState";
import { AccessDeniedState, EmptyState, NotFoundState } from "../states/states";
import { ErrorState } from "../states/ErrorState";
import { currentAssignmentQueryString, type CurrentAssignmentQuery } from "../../domain/assignment-current";
import type { CurrentAssignment } from "../../services/asset-assignments-contract";
import type { AssignmentRead } from "../../services/asset-assignments-api";
import type { AssetFilterOptions } from "../../services/assets-list-types";
import { assignmentErrorText } from "./assignment-error-text";
import { AssignmentsCurrentFilters } from "./AssignmentsCurrentFilters";
import { AssignmentsResults } from "./AssignmentsResults";
import { AssignmentsTable } from "./AssignmentsTable";
import { AssignmentsTableLoading } from "./AssignmentsTableLoading";
import { AssignmentsTabs } from "./AssignmentsTabs";

export function AssignmentsCurrentView({ result, filters, query, filtered, history = false }: {
  result: AssignmentRead<ListData<CurrentAssignment>>;
  filters: AssignmentRead<AssetFilterOptions>;
  query: CurrentAssignmentQuery;
  filtered: boolean;
  history?: boolean;
}) {
  const router = useRouter();
  const url = useListUrlState();
  const code = !result.ok ? result.code
    : !filters.ok && ["PERMISSION_DENIED", "UNAUTHENTICATED"].includes(filters.code) ? filters.code : null;
  const copy = assignmentErrorText(code ?? "");
  const retry = (
    <Button variant="outline" onClick={() => router.refresh()}>Retry</Button>
  );

  if (code === "PERMISSION_DENIED") return <AccessDeniedState {...copy} />;
  if (code === "UNAUTHENTICATED") return <EmptyState {...copy} />;
  if (code === "NOT_FOUND") return <NotFoundState {...copy} action={retry} />;

  const invalid = code === "VALIDATION";
  const page = result.ok && !history ? result.data : null;
  const outOfRange = page && !page.rows.length && page.total > 0;
  const firstPage = `/asset-workspace/assignments?tab=current&${currentAssignmentQueryString({ ...query, page: 1 })}`;
  const hasRows = Boolean(page?.rows.length);
  let content;
  if (url.isPending) {
    content = <AssignmentsTableLoading />;
  } else if (history) {
    content = <EmptyState title="Assignment History is available in a later release" body="Use Current Assignments to view assets with a current custodian." />;
  } else if (invalid) {
    content = (
      <EmptyState {...copy} action={(
        <Button asChild variant="outline">
          <Link href="/asset-workspace/assignments?tab=current">Clear filters</Link>
        </Button>
      )} />
    );
  } else if (!result.ok) {
    content = <ErrorState {...copy} />;
  } else if (outOfRange) {
    content = (
      <EmptyState title="No assignments on this page" body="Go to the first page to see the latest assignments." action={(
        <Button asChild variant="outline">
          <Link href={firstPage}>Go to first page</Link>
        </Button>
      )} />
    );
  } else if (!hasRows) {
    content = (
      <EmptyState
        title={filtered ? "No matching assignments" : "No current assignments"}
        body={filtered ? "Try another search or clear the filters." : "Assets appear here when they have a current custodian."}
      />
    );
  } else {
    content = <AssignmentsTable rows={result.data.rows} />;
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
      {!history && !invalid && <AssignmentsCurrentFilters url={url} result={filters} />}
      <AssignmentsResults
        busy={url.isPending}
        tab={history ? "history" : "current"}
        scrollKey={`${history}:${currentAssignmentQueryString(query)}`}
        footer={page && hasRows ? (
          <Pagination
            page={page.page}
            totalPages={page.totalPages}
            perPage={page.pageSize}
            perPageOptions={[...new Set([10, 25, 50, page.pageSize])].sort((a, b) => a - b)}
            totalItems={page.total}
            rangeStart={(page.page - 1) * page.pageSize + 1}
            rangeEnd={Math.min(page.page * page.pageSize, page.total)}
            itemLabel="assignments"
            onPageChange={(value) => url.set({ page: String(value) })}
            onPerPageChange={(value) => url.set({ pageSize: String(value) })}
          />
        ) : undefined}
      >
        {url.isPending || hasRows ? content : <div className="p-4">{content}</div>}
      </AssignmentsResults>
    </AssignmentsWorkspace>
  );
}
