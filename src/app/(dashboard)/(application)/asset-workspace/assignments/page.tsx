import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { AssignmentsCurrentView } from "@/features/asset-workspace/components/assignments/AssignmentsCurrentView";
import { getAssignmentFilters, getCurrentAssignments } from "@/features/asset-workspace/services/asset-assignments-api";
import { readCurrentAssignmentQuery, type AssignmentSearchParams } from "@/features/asset-workspace/domain/assignment-current";

export default async function AssignmentsPage({ searchParams }: { searchParams: Promise<AssignmentSearchParams> }) {
  const [params, session, token] = await Promise.all([searchParams, getSession(), getAuthToken()]);
  const parsed = readCurrentAssignmentQuery(params);
  const query = parsed.ok ? parsed.query : { page: 1, pageSize: 25 };
  const history = parsed.ok && parsed.tab === "history";
  const authCode = session === "forbidden" || !session.tenantId ? "PERMISSION_DENIED" : !token ? "UNAUTHENTICATED" : null;
  const auth = session !== "forbidden" && session.tenantId && token ? { tenantId: session.tenantId, token } : null;
  const [result, filters] = auth && parsed.ok && !history
    ? await Promise.all([getCurrentAssignments(auth, query), getAssignmentFilters(auth)])
    : [{ ok: false as const, code: authCode ?? (!parsed.ok ? "VALIDATION" : "HISTORY_PENDING") },
      { ok: false as const, code: authCode ?? "NOT_REQUESTED" }];
  return (
    <AssignmentsCurrentView key={`${session !== "forbidden" ? session.tenantId : "forbidden"}:${params.tab ?? "current"}`}
      result={result} filters={filters} query={query} filtered={parsed.ok && parsed.filtered} history={history} />
  );
}
