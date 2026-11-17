import { MyTasksView } from "@/features/asset-workspace/employee/my-tasks/MyTasksView";
import { getMyTasks } from "@/features/asset-workspace/employee/my-tasks/my-tasks-api";
import { MY_TASK_STATUSES } from "@/features/asset-workspace/employee/my-tasks/my-tasks";
import type { SearchParams } from "@/features/asset-workspace/services/asset-reports-api";

// My Tasks (EMP-03, UC-007): inventory checks assigned to the caller. Filters live in the URL.
export default async function MyTasksPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  // Status tabs show counts for the same search (PO mock 04).
  const countFor = async (status?: string) => (await getMyTasks({ q: sp.q, status, pageSize: "1" }))?.total ?? null;
  const [data, all, ...byStatus] = await Promise.all([
    getMyTasks(sp),
    countFor(),
    ...MY_TASK_STATUSES.map((status) => countFor(status)),
  ]);
  const counts = Object.fromEntries([["all", all], ...MY_TASK_STATUSES.map((status, i) => [status, byStatus[i]])]);
  return (
    <MyTasksView
      data={data}
      counts={counts}
      searched={Boolean(sp.q)}
    />
  );
}
