import { MyTaskView } from "@/features/asset-workspace/employee/my-tasks/MyTaskView";
import { getMyTask, getMyTaskAssets, getMyTaskFindings } from "@/features/asset-workspace/employee/my-tasks/my-tasks-api";
import { ErrorState } from "@/features/asset-workspace/components/states/ErrorState";
import { NotFoundState } from "@/features/asset-workspace/components/states/states";
import type { SearchParams } from "@/features/asset-workspace/services/asset-reports-api";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// One task (EMP-03). Someone else's task and a missing one look the same (README).
export default async function MyTaskPage({
  params,
  searchParams,
}: {
  params: Promise<{ taskId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ taskId }, sp] = await Promise.all([params, searchParams]);
  const id = taskId.toLowerCase();
  const task = UUID.test(id) ? await getMyTask(id) : "not-found";
  if (task === "not-found") {
    return (
      <div className="p-6">
        <NotFoundState
          title="Task not found"
          body="This task isn't assigned to you, or it no longer exists."
        />
      </div>
    );
  }
  if (task === null) {
    return (
      <div className="p-6">
        <ErrorState title="Couldn't load this task" />
      </div>
    );
  }
  const [assets, findings] = await Promise.all([getMyTaskAssets(id, sp), getMyTaskFindings(id)]);
  return (
    <MyTaskView
      task={task}
      assets={assets}
      findings={findings}
    />
  );
}
