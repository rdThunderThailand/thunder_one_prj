"use client";

import { Card } from "@/components/ui/Card";
import { ToolIcon } from "@/components/ui/icons";
import { assignmentHistoryDate } from "../../domain/assignment-history";
import { maintenanceDays, maintenancePeriods } from "../../domain/maintenance-periods.mts";
import { useProfileRead } from "../../hooks/use-asset-profile";
import { getAssetStatusHistory } from "../../services/asset-profile-api";
import { EmptyState } from "../states/states";
import { HistoryActor, HistoryTabTable, historyTabState } from "./ProfileHistoryTabParts";
import { StatusHistoryValue } from "./ProfileStatusHistoryPanel";

const columns = ["#", "Started", "Ended", "Days", "Returned To", "Started By", "Reason"];
const widths = ["w-8", "w-24", "w-24", "w-12", "w-28", "", ""];
const when = (at: string) => { const value = assignmentHistoryDate(at); return `${value.date} ${value.time}`; };
// shortcut: reads the latest 100 status changes only; move to a Core maintenance endpoint when the store exists.
const STATUS_CHANGES_READ = 100;

/** FE 08 (owner option B): In Maintenance periods from Status History; no Add / Edit until a maintenance store exists. */
export function ProfileMaintenanceHistory({ context, assetId, enabled }: { context: string; assetId: string; enabled: boolean }) {
  const history = useProfileRead(`${context}:${assetId}:maintenance-periods`,
    (signal) => getAssetStatusHistory(context, assetId, 1, null, signal, STATUS_CHANGES_READ), enabled);
  if (!enabled) return null;

  const periods = history.result?.ok ? maintenancePeriods(history.result.data.data) : [];
  const results = historyTabState(history, {
    loading: "Loading maintenance history…", table: <HistoryTabTable caption="Maintenance history" columns={columns} widths={widths} minWidth="min-w-xl" />,
    noun: "maintenance history", empty: "No maintenance yet.", filtered: false, onClear: () => {}, onFirstPage: () => {},
  }) ?? (periods.length ? (
    <HistoryTabTable caption="Maintenance history" columns={columns} widths={widths} minWidth="min-w-xl">
      {periods.map((period, index) => (
        <tr key={period.id}>
          <td className="px-3 py-3 align-top tabular-nums">{index + 1}</td>
          <td className="px-3 py-3 align-top tabular-nums">{when(period.startedAt)}</td>
          <td className="px-3 py-3 align-top tabular-nums">
            {period.endedAt ? when(period.endedAt) : <StatusHistoryValue status="In Maintenance" />}
          </td>
          <td className="px-3 py-3 align-top tabular-nums">{maintenanceDays(period.startedAt, period.endedAt)}</td>
          <td className="px-3 py-3 align-top">
            <StatusHistoryValue status={period.returnedTo} />
          </td>
          <td className="px-3 py-3 align-top">
            <HistoryActor name={period.startedBy} />
          </td>
          <td className="whitespace-pre-wrap px-3 py-3 align-top wrap-anywhere">{period.reason || "—"}</td>
        </tr>
      ))}
    </HistoryTabTable>
  ) : (
    <div className="p-4">
      <EmptyState title="No maintenance yet." body="Times this asset was set to In Maintenance will appear here." />
    </div>
  ));

  return (
    <Card className="min-w-0 p-0" aria-busy={history.pending}>
      <div className="flex items-start gap-2 px-4 py-3">
        <ToolIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <div>
          <h2 className="text-sm font-semibold">Maintenance History</h2>
          <p className="text-xs text-muted-foreground">Times this asset was In Maintenance, from its status changes.</p>
        </div>
      </div>
      {results}
    </Card>
  );
}
