import { MyTasksView } from "@/features/asset-workspace/employee/my-tasks/MyTasksView";
import { getMyTasks } from "@/features/asset-workspace/employee/my-tasks/my-tasks-api";
import type { SearchParams } from "@/features/asset-workspace/services/asset-reports-api";

// My Tasks (EMP-03, UC-007): inventory checks assigned to the caller. Filters live in the URL.
export default async function MyTasksPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  return (
    <MyTasksView
      data={await getMyTasks(sp)}
      filtered={Boolean(sp.q || sp.status)}
    />
  );
}
