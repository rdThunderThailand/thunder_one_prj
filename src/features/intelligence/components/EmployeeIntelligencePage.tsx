import { DocumentInsightsCard } from "./DocumentInsightsCard";
import { EmployeeActivityListCard } from "./EmployeeActivityListCard";
import { EmployeeAiInsightsCard } from "./EmployeeAiInsightsCard";
import { EmployeeAskThunderOneCard } from "./EmployeeAskThunderOneCard";
import { EmployeeIntelStatTiles } from "./EmployeeIntelStatTiles";
import { EmployeeIntelligenceHeader } from "./EmployeeIntelligenceHeader";
import { EmployeePerformanceTrendCard } from "./EmployeePerformanceTrendCard";
import { RecommendedActionsRow } from "./RecommendedActionsRow";
import { RelatedProjectsCard } from "./RelatedProjectsCard";
import { ThingsToKnowCard } from "./ThingsToKnowCard";
import { PlayIcon, SparklesIcon } from "@/components/ui/icons";

// The operator / employee_media ("employee") variant of the shell's shared
// Intelligence page — config/rbac.ts's resolveShellVariant. A personal
// productivity view rather than the CEO variant's org-wide dashboard
// (./IntelligencePage.tsx) or the manager variant's team insight cards
// (./ManagerIntelligencePage.tsx).
export function EmployeeIntelligencePage() {
  return (
    <div className="flex flex-col gap-6">
      <EmployeeIntelligenceHeader />

      <EmployeeAskThunderOneCard />

      <EmployeeIntelStatTiles />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EmployeeAiInsightsCard />
        </div>
        <EmployeePerformanceTrendCard />
      </div>

      <RecommendedActionsRow />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <EmployeeActivityListCard />
        <RelatedProjectsCard />
        <div className="flex flex-col gap-4">
          <DocumentInsightsCard />
          <ThingsToKnowCard />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary bg-accent/40 px-4 py-3 text-sm">
        <span className="flex items-center gap-2 text-foreground">
          <SparklesIcon className="h-4 w-4 text-primary" />
          Tip: ถาม ThunderOne AI ได้ทุกเรื่องที่เกี่ยวกับงาน เอกสาร หรือข้อมูลของคุณ
        </span>
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 text-xs font-semibold text-t1-gray-400"
        >
          เรียนรู้เพิ่มเติมเกี่ยวกับ Intelligence
          <PlayIcon className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  );
}
