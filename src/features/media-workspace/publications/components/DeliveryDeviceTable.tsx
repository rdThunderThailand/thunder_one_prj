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
import type {
  PublicationDeliveryTarget,
  PublicationPlaybackWindow,
  PublicationSchedule,
} from "../types";

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

function formatBytes(bytes?: number | null): string {
  if (bytes == null) return "—";
  const exact = `${bytes.toLocaleString()} B`;
  if (bytes < 1024) return exact;
  if (bytes < 1024 * 1024) return `${exact} (${(bytes / 1024).toFixed(1)} KB)`;
  return `${exact} (${(bytes / (1024 * 1024)).toFixed(1)} MB)`;
}

export function DeliveryDeviceTable({
  id,
  targets,
  schedule,
  playbackWindow,
  onRetried,
}: {
  id: string;
  targets: PublicationDeliveryTarget[];
  schedule?: PublicationSchedule | null;
  playbackWindow?: PublicationPlaybackWindow | null;
  onRetried: () => void;
}) {
  const [query, setQuery] = useState("");
  const [resultFilter, setResultFilter] = useState<DeviceResult | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);

  const rows = filterDeliveryRows(
    buildDeliveryRows(targets, schedule, new Date(), playbackWindow),
    query,
    resultFilter
  );

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
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm">
          <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหา device..."
            className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
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
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-border/60"
              }`}
            >
              {f === "all" ? "All" : RESULT_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {retryError && <p className="mb-2 text-xs text-danger">{retryError}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs font-medium text-muted-foreground">
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
                    className="cursor-pointer border-t border-border"
                    onClick={() => setExpandedId(isExpanded ? null : target.device_id)}
                  >
                    <td className="py-2.5 pr-3 font-medium text-foreground">
                      {target.device_name ?? target.device_id}
                      {target.via_groups && target.via_groups.length > 0 && (
                        <p className="mt-0.5 text-[11px] font-normal text-muted-foreground">
                          via {target.via_groups.join(", ")}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{progress.stage2}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{progress.stage3}</td>
                    <td className="py-2.5 pr-3">
                      <Badge color={RESULT_BADGE[progress.result]} variant="pill">
                        {RESULT_LABEL[progress.result]}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">
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
                    <tr className="border-t border-border bg-muted">
                      <td colSpan={6} className="px-3 py-3 text-xs text-muted-foreground">
                        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <div>
                            <dt className="text-muted-foreground">Error</dt>
                            <dd className="text-danger">{target.error_message ?? "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Last Heartbeat</dt>
                            <dd>{formatDate(target.last_heartbeat_at)}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Retry Count</dt>
                            <dd>{target.retry_count ?? 0}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Last Retried</dt>
                            <dd>{formatDate(target.last_retried_at)}</dd>
                          </div>
                        </dl>
                        {target.file_statuses && Object.keys(target.file_statuses).length > 0 && (
                          <div className="mt-2">
                            <span className="text-muted-foreground">Files</span>
                            <ul className="mt-1 flex flex-col gap-2">
                              {Object.entries(target.file_statuses).map(([assetId, entry]) => (
                                <li key={assetId} className="rounded border border-border p-2">
                                  <div className="font-medium text-foreground">
                                    Local filename: {entry.file_name ?? "—"}
                                  </div>
                                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
                                    <span>Asset: {assetId}</span>
                                    <span>Status: {entry.status}</span>
                                    <span>Actual bytes on disk: {formatBytes(entry.file_size)}</span>
                                    {entry.downloaded !== undefined && (
                                      <span>{entry.downloaded ? "Fetched this run" : "Cache reused"}</span>
                                    )}
                                    {entry.verified !== undefined && (
                                      <span>
                                        Verification: {entry.checksum == null ? "Unavailable" : entry.verified ? "Verified" : "Failed"}
                                      </span>
                                    )}
                                    <span>Device reported: {formatDate(entry.reported_at)}</span>
                                    <span>Server received: {formatDate(entry.acked_at)}</span>
                                  </div>
                                  {entry.checksum && <div className="mt-1 break-all text-muted-foreground">Checksum: {entry.checksum}</div>}
                                  {entry.error && <div className="mt-1 text-danger">{entry.error}</div>}
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
          <p className="py-4 text-center text-sm text-muted-foreground">ไม่พบ device ที่ตรงกับตัวกรอง</p>
        )}
      </div>
    </div>
  );
}
