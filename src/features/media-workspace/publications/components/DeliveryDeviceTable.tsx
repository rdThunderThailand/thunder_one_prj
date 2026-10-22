"use client";

import { Fragment, useState } from "react";
import { ChevronDownIcon, ChevronRightIcon, SearchIcon } from "@/components/ui/icons";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  buildDeliveryRows,
  filterDeliveryRows,
  sortDeliveryRows,
  canRetryTarget,
  deviceStatus,
  type DeviceResult,
  type DeviceStatusTone,
} from "../delivery-progress";
import { retryPublicationTargets } from "../services/publications-api";
import { classifyApiError } from "@/lib/api/api-error";
import { DeliveryDeviceDetail } from "./DeliveryDeviceDetail";
import type {
  PublicationDeliveryTarget,
  PublicationPlaybackWindow,
  PublicationSchedule,
} from "../types";

const TONE_BADGE: Record<DeviceStatusTone, BadgeColor> = {
  success: "green",
  info: "blue",
  "in-progress": "indigo",
  warning: "yellow",
  error: "red",
};

// Problems first, matching the row order.
const FILTERS: { value: DeviceResult | "all"; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "error", label: "ล้มเหลว" },
  { value: "warning", label: "ต้องดู" },
  { value: "processing", label: "กำลังส่ง" },
  { value: "success", label: "เล่นแล้ว" },
];

const relativeTime = new Intl.RelativeTimeFormat("th", { numeric: "auto" });

function formatRelative(dateStr: string | null | undefined, now: Date): string {
  if (!dateStr) return "—";
  const seconds = Math.round((new Date(dateStr).getTime() - now.getTime()) / 1000);
  if (Number.isNaN(seconds)) return dateStr;
  const abs = Math.abs(seconds);
  if (abs < 60) return relativeTime.format(seconds, "second");
  if (abs < 3600) return relativeTime.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return relativeTime.format(Math.round(seconds / 3600), "hour");
  return relativeTime.format(Math.round(seconds / 86400), "day");
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

  const now = new Date();
  const allRows = buildDeliveryRows(targets, schedule, now, playbackWindow);
  const rows = sortDeliveryRows(filterDeliveryRows(allRows, query, resultFilter));
  const countFor = (value: DeviceResult | "all") =>
    value === "all" ? allRows.length : allRows.filter(({ progress }) => progress.result === value).length;

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
            aria-label="ค้นหา device"
            className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={resultFilter === value}
              onClick={() => setResultFilter(value)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                resultFilter === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-border/60"
              }`}
            >
              {label} {countFor(value)}
            </button>
          ))}
        </div>
      </div>

      {retryError && <p className="mb-2 text-xs text-error">{retryError}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs font-medium text-muted-foreground">
              <th className="py-2 pr-3">Device</th>
              <th className="py-2 pr-3">สถานะ</th>
              <th className="py-2 pr-3">อัปเดตล่าสุด</th>
              <th className="py-2 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ target, progress }) => {
              const isExpanded = expandedId === target.device_id;
              const status = deviceStatus(progress, target.error_message);
              const detailId = `delivery-detail-${target.device_id}`;
              return (
                <Fragment key={target.device_id}>
                  <tr className="border-t border-border align-top">
                    <td className="py-2.5 pr-3">
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls={detailId}
                        onClick={() => setExpandedId(isExpanded ? null : target.device_id)}
                        className="flex items-start gap-1.5 text-left font-medium text-foreground hover:text-primary"
                      >
                        {isExpanded ? (
                          <ChevronDownIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRightIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span>
                          {target.device_name ?? target.device_id}
                          {target.via_groups && target.via_groups.length > 0 && (
                            <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                              via {target.via_groups.join(", ")}
                            </span>
                          )}
                        </span>
                      </button>
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge color={TONE_BADGE[status.tone]} variant="pill">
                        {status.label}
                      </Badge>
                      {status.detail && (
                        <p
                          className="mt-1 max-w-xs truncate text-xs text-error"
                          title={status.detail}
                        >
                          {status.detail}
                        </p>
                      )}
                    </td>
                    <td
                      className="whitespace-nowrap py-2.5 pr-3 text-muted-foreground"
                      title={target.updated_at ? new Date(target.updated_at).toLocaleString() : undefined}
                    >
                      {formatRelative(target.updated_at, now)}
                    </td>
                    <td className="py-2.5 text-right">
                      {canRetryTarget(progress) && (
                        <Button
                          variant="ghost"
                          onClick={() => handleRetryOne(target.device_id)}
                          disabled={retryingId === target.device_id}
                        >
                          {retryingId === target.device_id ? "กำลังส่งใหม่…" : "ลองส่งใหม่"}
                        </Button>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr
                      id={detailId}
                      className="border-t border-border bg-muted"
                    >
                      <td
                        colSpan={4}
                        className="px-3 py-3"
                      >
                        <DeliveryDeviceDetail target={target} />
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
