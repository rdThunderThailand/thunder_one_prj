"use client";

import { Fragment, useState } from "react";
import { SearchIcon } from "@/components/ui/icons";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  buildDeliveryRows,
  filterDeliveryRows,
  canRetryTarget,
  type DeviceResult,
} from "../delivery-progress";
import { retryPublicationTargets } from "../services/publications-api";
import { classifyApiError } from "@/lib/api/api-error";
import type { PublicationDeliveryTarget, PublicationSchedule } from "../types";

const RESULT_LABEL: Record<DeviceResult, string> = {
  success: "Success",
  processing: "Processing",
  warning: "Warning",
  error: "Error",
};

const RESULT_BADGE: Record<DeviceResult, BadgeColor> = {
  success: "green",
  processing: "blue",
  warning: "yellow",
  error: "red",
};

const FILTERS: (DeviceResult | "all")[] = ["all", "success", "processing", "warning", "error"];

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

export function DeliveryDeviceTable({
  id,
  targets,
  schedule,
  onRetried,
}: {
  id: string;
  targets: PublicationDeliveryTarget[];
  schedule?: PublicationSchedule | null;
  onRetried: () => void;
}) {
  const [query, setQuery] = useState("");
  const [resultFilter, setResultFilter] = useState<DeviceResult | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);

  const rows = filterDeliveryRows(buildDeliveryRows(targets, schedule, new Date()), query, resultFilter);

  async function handleRetryOne(deviceId: string) {
    setRetryingId(deviceId);
    setRetryError(null);
    try {
      await retryPublicationTargets(id, [deviceId]);
      onRetried();
    } catch (err) {
      setRetryError(classifyApiError(err, "สั่ง retry ไม่สำเร็จ").message);
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <SearchIcon className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหา device..."
            className="w-full bg-transparent text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
          />
        </div>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setResultFilter(f)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                resultFilter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              {f === "all" ? "All" : RESULT_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {retryError && <p className="mb-2 text-xs text-red-600 dark:text-red-400">{retryError}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-400 dark:border-zinc-800">
              <th className="py-2 pr-3">Device</th>
              <th className="py-2 pr-3">Delivery</th>
              <th className="py-2 pr-3">Playback</th>
              <th className="py-2 pr-3">Result</th>
              <th className="py-2 pr-3">Updated</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ target, progress }) => {
              const isExpanded = expandedId === target.device_id;
              return (
                <Fragment key={target.device_id}>
                  <tr
                    className="cursor-pointer border-t border-zinc-100 dark:border-zinc-800"
                    onClick={() => setExpandedId(isExpanded ? null : target.device_id)}
                  >
                    <td className="py-2.5 pr-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {target.device_name ?? target.device_id}
                    </td>
                    <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-400">{progress.stage2}</td>
                    <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-400">{progress.stage3}</td>
                    <td className="py-2.5 pr-3">
                      <Badge color={RESULT_BADGE[progress.result]} variant="pill">
                        {RESULT_LABEL[progress.result]}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-400">
                      {formatDate(target.updated_at)}
                    </td>
                    <td className="py-2.5 text-right">
                      {canRetryTarget(progress) && (
                        <Button
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRetryOne(target.device_id);
                          }}
                          disabled={retryingId === target.device_id}
                        >
                          {retryingId === target.device_id ? "…" : "Retry"}
                        </Button>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-t border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
                      <td colSpan={6} className="px-3 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <div>
                            <dt className="text-zinc-400">Error</dt>
                            <dd className="text-red-600 dark:text-red-400">{target.error_message ?? "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-zinc-400">Last Heartbeat</dt>
                            <dd>{formatDate(target.last_heartbeat_at)}</dd>
                          </div>
                          <div>
                            <dt className="text-zinc-400">Retry Count</dt>
                            <dd>{target.retry_count ?? 0}</dd>
                          </div>
                          <div>
                            <dt className="text-zinc-400">Last Retried</dt>
                            <dd>{formatDate(target.last_retried_at)}</dd>
                          </div>
                        </dl>
                        {target.file_statuses && Object.keys(target.file_statuses).length > 0 && (
                          <div className="mt-2">
                            <span className="text-zinc-400">Files</span>
                            <ul className="mt-1 flex flex-col gap-0.5">
                              {Object.entries(target.file_statuses).map(([assetId, entry]) => (
                                <li key={assetId}>
                                  {assetId}: {entry.status}
                                  {entry.error ? ` — ${entry.error}` : ""}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="py-4 text-center text-sm text-zinc-400">ไม่พบ device ที่ตรงกับตัวกรอง</p>
        )}
      </div>
    </div>
  );
}
