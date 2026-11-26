import { MyHomeView } from "@/features/asset-workspace/employee/home/MyHomeView";
import { getMyAssets } from "@/features/asset-workspace/employee/my-assets/my-assets-api";
import { getMyTasks } from "@/features/asset-workspace/employee/my-tasks/my-tasks-api";
import { getSession } from "@/features/auth/services/get-session";

// Home (EMP-01, UC-002 / UC-007 / UC-011): the caller's overview and next actions. No new Core route; each read
// fails on its own (spec 01-home).
export default async function MyHomePage() {
  const [session, latest, inMaintenance, tasks] = await Promise.all([
    getSession(),
    getMyAssets({ page: 1, pageSize: 4, sort: "status_since" }),
    getMyAssets({ page: 1, pageSize: 1, sort: "created_at", status: "In Maintenance" }),
    getMyTasks({ status: "In Progress", pageSize: "5" }),
  ]);
  // userName falls back to the email when the account has no name; greet with the part before "@".
  const firstName = session && session !== "forbidden" ? session.userName.split("@")[0].trim().split(/\s+/)[0] : "";
  return (
    <MyHomeView
      firstName={firstName}
      latest={latest}
      inMaintenance={inMaintenance?.total ?? null}
      tasks={tasks}
    />
  );
}
