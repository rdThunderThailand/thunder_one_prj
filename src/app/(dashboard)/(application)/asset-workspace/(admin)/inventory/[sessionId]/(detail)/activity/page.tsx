import { SessionActivityView } from "@/features/asset-workspace/components/inventory/SessionActivityView";
import {
  getInventoryActivity,
  getInventoryAssignments,
  getInventorySession,
} from "@/features/asset-workspace/services/asset-inventory-api";
import type { SearchParams } from "@/features/asset-workspace/services/asset-reports-api";

// Session Activity tab: `?type=&actorId=&from=&to=&q=&page=&pageSize=` go to Core as they are (from / to = days).
// ponytail: the User filter lists the owner and assignees; an Asset Admin acting outside the assignments is not listed.
export default async function SessionActivityPage({ params, searchParams }: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ sessionId }, sp] = await Promise.all([params, searchParams]);
  const [session, assignments, data] = await Promise.all([
    getInventorySession(sessionId),
    getInventoryAssignments(sessionId),
    getInventoryActivity(sessionId, sp),
  ]);
  const people = [
    ...(typeof session === "object" && session?.owner ? [session.owner] : []),
    ...(assignments?.data.map((g) => g.assignee) ?? []),
  ];
  const users = [...new Map(people.map((p) => [p.id, { id: p.id, name: p.name }])).values()];
  return (
    <SessionActivityView
      data={data}
      users={users}
    />
  );
}
