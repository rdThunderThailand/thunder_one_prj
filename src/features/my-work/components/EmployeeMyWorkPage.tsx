import { AskThunderOneBar } from "./AskThunderOneBar";
import { DoFirstCard } from "./DoFirstCard";
import { EmployeeMyWorkHeader } from "./EmployeeMyWorkHeader";
import { EmployeeQuickActionsCard } from "./EmployeeQuickActionsCard";
import { EmployeeScheduleRailCard } from "./EmployeeScheduleRailCard";
import { EmployeeWorkStatTiles } from "./EmployeeWorkStatTiles";
import { ImportantForYouCard } from "./ImportantForYouCard";
import { MyTasksCard } from "./MyTasksCard";
import { WaitingOnOthersCard } from "./WaitingOnOthersCard";

// The operator/employee_media ("employee") variant of the shell's shared My
// Work page — config/rbac.ts's resolveShellVariant. A personal task list
// (Do First, My Tasks, Waiting on Others) rather than the manager variant's
// table-of-everyone shape (./ManagerMyWorkPage.tsx).
export function EmployeeMyWorkPage() {
  return (
    <div className="flex flex-col gap-6">
      <EmployeeMyWorkHeader />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <EmployeeWorkStatTiles />
          <DoFirstCard />
          <MyTasksCard />
          <WaitingOnOthersCard />
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
