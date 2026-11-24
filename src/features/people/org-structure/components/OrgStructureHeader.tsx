import { Button } from "@/components/ui/Button";
import { ChevronDownIcon, PlusIcon, UploadIcon } from "@/components/ui/icons";
import type { OrgUnitNode, OrgViewTabId } from "../mock-data";
import { exportOrgTreeCsv } from "../export-csv";
import { OrgViewTabs } from "./OrgViewTabs";

interface OrgStructureHeaderProps {
  activeView: OrgViewTabId;
  onChangeView: (id: OrgViewTabId) => void;
  /** For the real "Export" button (whole-tree CSV) — `null`/no root
   *  disables it, same as every other real-data-dependent control here. */
  units: Record<string, OrgUnitNode> | null;
  rootUnitId: string | null;
}

export function OrgStructureHeader({ activeView, onChangeView, units, rootUnitId }: OrgStructureHeaderProps) {
  const canExport = Boolean(units && rootUnitId);
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">โครงสร้างองค์กร</h1>
        <p className="mt-1 text-sm text-muted-foreground">โครงสร้างหน่วยงาน ทีม และสายการบังคับบัญชา</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <OrgViewTabs active={activeView} onChange={onChangeView} />
        <button
          type="button"
          disabled={!canExport}
          onClick={() => units && rootUnitId && exportOrgTreeCsv(units, rootUnitId)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-t1-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <UploadIcon className="h-4 w-4 rotate-180" />
          Export
        </button>
        <Button variant="primary" title="Not built yet" disabled>
          <PlusIcon className="h-4 w-4" />
          เพิ่มหน่วยงาน
          <ChevronDownIcon className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
