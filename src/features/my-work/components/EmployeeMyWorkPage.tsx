import { AskThunderOneBar } from "./AskThunderOneBar";
import { DoFirstCard } from "./DoFirstCard";
import { EmployeeMyWorkHeader } from "./EmployeeMyWorkHeader";
import { EmployeeQuickActionsCard } from "./EmployeeQuickActionsCard";
import { EmployeeScheduleRailCard } from "./EmployeeScheduleRailCard";
import { EmployeeWorkStatTiles } from "./EmployeeWorkStatTiles";
import { ImportantForYouCard } from "./ImportantForYouCard";
import { MyTasksCard } from "./MyTasksCard";
import { WaitingOnOthersCard } from "./WaitingOnOthersCard";
import type { MyWork } from "../work-items";

// The operator/employee_media ("employee") variant of the shell's shared My
// Work page — config/rbac.ts's resolveShellVariant. Built with the
// `personal` scope, so it only lists what's addressed to this user (their
// own drafts, plus reviews if they're a reviewer) — never tenant-wide
// follow-ups.
export function EmployeeMyWorkPage({ work, nowIso, userName }: { work: MyWork; nowIso: string; userName: string }) {
  const now = new Date(nowIso);

  return (
    <div className="flex flex-col gap-6">
      <EmployeeMyWorkHeader
        userName={userName}
        now={now}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <EmployeeWorkStatTiles
            work={work}
            now={now}
          />
          <DoFirstCard
            items={work.items}
            now={now}
          />
          <MyTasksCard
            items={work.items}
            completed={work.completed}
            nowIso={nowIso}
          />
          <WaitingOnOthersCard items={work.items} />
        </div>
        <div className="flex flex-col gap-4">
          <EmployeeScheduleRailCard />
          <ImportantForYouCard />
          <EmployeeQuickActionsCard />
        </div>
      </div>

      <AskThunderOneBar />
    </div>
  );
}
