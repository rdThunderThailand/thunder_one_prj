import { Suspense } from "react";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { AssignmentsCurrentView } from "@/features/asset-workspace/components/assignments/AssignmentsCurrentView";
import { getAssignmentFilters, getCurrentAssignments } from "@/features/asset-workspace/services/asset-assignments-api";
import { readCurrentAssignmentQuery, type AssignmentSearchParams } from "@/features/asset-workspace/domain/assignment-current";
import { readAssignmentHistoryQuery } from "@/features/asset-workspace/domain/assignment-history";
import { getAssignmentHistory } from "@/features/asset-workspace/services/asset-assignments-api";
import { AssignmentsHistoryView } from "@/features/asset-workspace/components/assignments/AssignmentsHistoryView";
import { AssignmentsLoading } from "@/features/asset-workspace/components/assignments/AssignmentsLoading";

async function HistoryContent({ params, auth, authCode }: {
  params: AssignmentSearchParams;
  auth: { tenantId: string; token: string } | null;
  authCode: string | null;
}) {
  const parsed = readAssignmentHistoryQuery(params);
  const query = parsed.ok ? parsed.query : { page: 1, pageSize: 20 };
  const result = auth && parsed.ok ? await getAssignmentHistory(auth, query)
    : { ok: false as const, code: authCode ?? "VALIDATION" };
  return (
    <AssignmentsHistoryView result={result} query={query} filtered={parsed.ok && parsed.filtered} />
  );
}

export default async function AssignmentsPage({ searchParams }: { searchParams: Promise<AssignmentSearchParams> }) {
  const [params, session, token] = await Promise.all([searchParams, getSession(), getAuthToken()]);
  const authCode = session === "forbidden" || !session.tenantId ? "PERMISSION_DENIED" : !token ? "UNAUTHENTICATED" : null;
  const auth = session !== "forbidden" && session.tenantId && token ? { tenantId: session.tenantId, token } : null;
  if (params.tab === "history") {
    return (
      <Suspense key={JSON.stringify(params)} fallback={<AssignmentsLoading history />}>
        <HistoryContent params={params} auth={auth} authCode={authCode} />
      </Suspense>
    );
  }
  const parsed = readCurrentAssignmentQuery(params);
  const query = parsed.ok ? parsed.query : { page: 1, pageSize: 25 };
  const [result, filters] = auth && parsed.ok
    ? await Promise.all([getCurrentAssignments(auth, query), getAssignmentFilters(auth)])
    : [{ ok: false as const, code: authCode ?? "VALIDATION" },
      { ok: false as const, code: authCode ?? "NOT_REQUESTED" }];
  return (
    <AssignmentsCurrentView key={`${session !== "forbidden" ? session.tenantId : "forbidden"}:${params.tab ?? "current"}`}
      result={result} filters={filters} query={query} filtered={parsed.ok && parsed.filtered} />
  );
}
