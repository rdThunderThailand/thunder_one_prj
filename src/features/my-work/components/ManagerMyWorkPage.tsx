import { AskThunderOneBar } from "./AskThunderOneBar";
import { ManagerMyWorkHeader } from "./ManagerMyWorkHeader";
import { ManagerTaskList } from "./ManagerTaskList";
import { ManagerWorkStatTiles } from "./ManagerWorkStatTiles";
import { MyCalendarCard } from "./MyCalendarCard";
import { MyGoalsCard } from "./MyGoalsCard";
import { QuickActionsGrid } from "./QuickActionsGrid";
import { RecentDocumentsCard } from "./RecentDocumentsCard";
import type { MyWork } from "../work-items";

// The department_admin / manager_it_asset ("manager") variant of the shell's
// shared My Work page — config/rbac.ts's resolveShellVariant. A table
// rather than the CEO variant's grouped queue, over the same `MyWork` data.
export function ManagerMyWorkPage({ work, nowIso }: { work: MyWork; nowIso: string }) {
  return (
    <div className="flex flex-col gap-6">
      <ManagerMyWorkHeader />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <ManagerWorkStatTiles
            work={work}
            now={new Date(nowIso)}
          />
          <ManagerTaskList
            items={work.items}
            nowIso={nowIso}
          />
        </div>
        <div className="flex flex-col gap-4">
          <MyCalendarCard />
          <QuickActionsGrid />
          <RecentDocumentsCard />
          <MyGoalsCard />
        </div>
      </div>

      <AskThunderOneBar />
    </div>
  );
}
