"use client";

import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Card } from "@/components/ui/Card";
import {
  assignmentEventKey, assignmentHistoryQueryString, HISTORY_FILTER_KEYS, readAssignmentHistoryQuery,
} from "../../domain/assignment-history";
import { categoryDisplay } from "../../domain/asset-profile-display.mts";
import { currentProfileAssignmentKey } from "../../domain/assignment-profile";
import { useProfileRead } from "../../hooks/use-asset-profile";
import { getProfileAssignments, type ProfileAssignmentEvent } from "../../services/asset-assignments-profile-api";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { AccessDeniedState, EmptyState, NotFoundState } from "../states/states";
import { ErrorState } from "../states/ErrorState";
import { assignmentErrorText } from "./assignment-error-text";
import { AssignmentsHistoryFilters } from "./AssignmentsHistoryFilters";
import { AssignmentsHistoryPanel } from "./AssignmentsHistoryPanel";
import { ProfileAssignmentEventsLoading } from "./ProfileAssignmentEventsLoading";
import { CurrentAssignmentBadge, ProfileAssignmentEventsTable } from "./ProfileAssignmentEventsTable";
import { ProfileAssignmentPager } from "./ProfileAssignmentPager";

type Filters = Record<string, string | undefined>;
const PAGE_SIZE = 20;

export function ProfileAssignmentEvents({ context, asset, layout, enabled = true }: {
  context: string;
  asset: AssetDetail;
  layout?: (content: ReactNode, panel: ReactNode) => ReactNode;
  enabled?: boolean;
}) {
  const history = Boolean(layout);
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState<string>();
  const [dismissed, setDismissed] = useState(false);
  const opener = useRef<HTMLElement>(null);
  const parsed = readAssignmentHistoryQuery({ ...filters, page: String(page), pageSize: String(PAGE_SIZE) });
  const source = parsed.ok ? assignmentHistoryQueryString(parsed.query) : "invalid";
  const read = useProfileRead(`${context}:${asset.id}:assignments:${source}`, (signal) => {
    if (!parsed.ok) return Promise.resolve({ ok: false, status: 400, code: "VALIDATION", message: "" } as const);
    return getProfileAssignments(context, asset.id, parsed.query, signal);
  }, enabled);

  if (!enabled && layout) return layout(null, null);

  function changePage(next: number) {
    if (next === page) return;
    setSelection(undefined);
    setDismissed(false);
    setPage(next);
  }
  function changeFilters(updates: Filters) {
    const next = { ...filters, ...updates };
    if (!HISTORY_FILTER_KEYS.some((key) => next[key] !== filters[key])) return;
    setSelection(undefined);
    setDismissed(false);
    setPage(1);
    setFilters(next);
  }
  function select(event: ProfileAssignmentEvent, trigger: HTMLElement) {
    opener.current = trigger;
    setDismissed(false);
    setSelection(assignmentEventKey(event));
  }
  function close() {
    setDismissed(true);
    setSelection(undefined);
    opener.current?.focus({ preventScroll: true });
  }
  function clear() {
    changeFilters(Object.fromEntries(HISTORY_FILTER_KEYS.map((key) => [key, undefined])));
  }

  const filtered = HISTORY_FILTER_KEYS.some((key) => Boolean(filters[key]));
  const data = read.result?.ok ? read.result.data : null;
  const selected = history && !dismissed && data?.data.length
    ? (data.data.find((event) => assignmentEventKey(event) === selection) ?? data.data[0])
    : undefined;
  const activeKey = selected ? assignmentEventKey(selected) : undefined;
  const currentKey = data ? currentProfileAssignmentKey(data.data, asset.custody) : undefined;
  const reset = <Button variant="outline" onClick={clear}>Clear filters</Button>;
  const retry = <Button variant="outline" onClick={read.reload}>Retry</Button>;
  let results;
  if (!read.result || (read.pending && !data)) {
    results = <ProfileAssignmentEventsLoading history={history} />;
  } else if (!read.result.ok) {
    const code = read.result.code ?? "";
    const copy = assignmentErrorText(code);
    results = (
      <div className="p-4">
        {code === "PERMISSION_DENIED" ? <AccessDeniedState {...copy} />
          : code === "UNAUTHENTICATED" ? <EmptyState {...copy} />
            : code === "NOT_FOUND" ? <NotFoundState title="Asset not found"
              body="This asset doesn't exist in your organization, or it is no longer available." action={retry} />
              : code === "VALIDATION" ? <EmptyState {...copy} action={reset} />
                : <ErrorState {...copy} onRetry={read.reload} />}
      </div>
    );
  } else if (!read.result.data.data.length) {
    results = (
      <div className="p-4">
        {read.result.data.total > 0 ? (
          <EmptyState title="No assignment history on this page" body="Go to the first page to see the latest assignment events."
            action={<Button variant="outline" onClick={() => changePage(1)}>Go to first page</Button>} />
        ) : (
          <EmptyState title={filtered ? "No matching assignment history" : "No assignment history"}
            body={filtered ? "Try another search or clear the filters." : "Assignment events appear here after assets are assigned, transferred or returned."}
            action={filtered ? reset : undefined} />
        )}
      </div>
    );
  } else {
    const { data: rows, ...pagination } = read.result.data;
    results = (
      <div className="flex min-h-60 flex-col justify-between">
        <ProfileAssignmentEventsTable history={history} rows={rows} page={pagination.page} pageSize={pagination.pageSize}
          currentKey={currentKey} selectedKey={activeKey} onSelect={history ? select : undefined} />
        <ProfileAssignmentPager {...pagination} itemLabel={history ? "assignment history records" : "assignments"}
          onPageChange={changePage} />
      </div>
    );
  }

  const content = (
    <div className="@container/assignments min-w-0 space-y-3">
      {history && (
        <AssignmentsHistoryFilters url={{ get: (key) => filters[key], set: changeFilters, isPending: read.pending }} />
      )}
      <Card className="min-w-0 p-0 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none" aria-busy={read.pending}>
        {!history && <h2 className="px-4 py-3 text-sm font-semibold">Assignment History</h2>}
        {results}
      </Card>
    </div>
  );
  if (!layout) return content;
  return layout(content, selected && data ? (
    <AssignmentsHistoryPanel event={selected} expiresAt={data.expiresAt} onClose={close} onRefresh={read.reload}
      refreshing={read.pending} category={categoryDisplay(asset.categoryPath).category}
      eventMeta={assignmentEventKey(selected) === currentKey ? <CurrentAssignmentBadge /> : undefined} />
  ) : null);
}
