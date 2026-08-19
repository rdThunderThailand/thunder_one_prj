"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useDeliveryProgress } from "../hooks/useDeliveryProgress";
import {
  summarizeDelivery,
  buildDeliveryRows,
  canRetryTarget,
  type PublishResult,
} from "../delivery-progress";
import { retryPublicationTargets } from "../services/publications-api";
import { classifyApiError } from "@/lib/api/api-error";
import { DeliveryDeviceTable } from "./DeliveryDeviceTable";
import { DeliveryStages, type DeliveryStage } from "./DeliveryStages";
import type { PublicationDetail } from "../types";

const RESULT_BADGE: Record<PublishResult, BadgeColor> = {
  Publishing: "indigo",
  "Published Successfully": "green",
  "Completed with Warnings": "yellow",
  "Publish Failed": "red",
  Cancelled: "zinc",
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

function stageStates(complete: boolean[], isPublishing: boolean): DeliveryStage["state"][] {
  // Only one stage is "active": the first unfinished one, and only while the run is still
  // moving. Once it has settled, everything unfinished is simply pending — nothing is working.
  const activeIndex = isPublishing ? complete.findIndex((done) => !done) : -1;
  return complete.map((done, i) =>
    done ? "complete" : i === activeIndex ? "active" : "pending"
  );
}

export function DeliveryProgress({
  id,
  initialDetail,
}: {
  id: string;
  initialDetail?: PublicationDetail | null;
}) {
  const { detail, refresh } = useDeliveryProgress(id, initialDetail);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  if (!detail) return null;

  const targets = detail.targets ?? [];

  if (targets.length === 0) {
    return (
      <Card className="p-5">
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Delivery Progress
        </h2>
        <p className="text-sm text-zinc-400">ยังไม่มีข้อมูลการส่ง</p>
      </Card>
    );
  }

  const now = new Date();
  const summary = summarizeDelivery(targets, detail, detail.schedule, now);
  const rows = buildDeliveryRows(targets, detail.schedule, now);
  const hasRetryableTargets = rows.some(({ progress }) => canRetryTarget(progress));

  async function handleRetryAll() {
    setRetrying(true);
    setRetryError(null);
    try {
      await retryPublicationTargets(id);
      refresh();
    } catch (err) {
      setRetryError(classifyApiError(err, "สั่ง retry ไม่สำเร็จ").message);
    } finally {
      setRetrying(false);
    }
  }

  const isPublishing = summary.result === "Publishing";
  const [mediaState, deliverState, playbackState] = stageStates(
    [
      // Stage 1 is done the moment a job exists: activation pins the file versions and inserts
      // the targets in one transaction, so having targets at all means the media is ready.
      true,
      summary.stage2Done === summary.total,
      summary.stage3Done === summary.total,
    ],
    isPublishing
  );

  const stages: DeliveryStage[] = [
    { label: "Media Ready", caption: "Completed", state: mediaState },
    {
      label: "Delivered",
      caption: `${summary.stage2Done}/${summary.total} devices`,
      state: deliverState,
    },
    {
      label: "Playback Confirmed",
      caption: `${summary.stage3Done}/${summary.total} devices`,
      state: playbackState,
    },
  ];

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Delivery Progress</h2>
          <p className="text-xs text-zinc-400">
            Published {formatDate(detail.activated_at)} · {summary.total} devices
            {summary.completedAt && <> · Completed {formatDate(summary.completedAt)}</>}
          </p>
        </div>
        <Badge color={RESULT_BADGE[summary.result]} variant="pill">
          {summary.result}
        </Badge>
      </div>

      <ProgressBar
        value={summary.overallPercent}
        color={summary.failed > 0 ? "amber" : "indigo"}
        className="mb-2"
        animated={isPublishing}
      />
      <p className="mb-5 flex flex-wrap items-center gap-x-2 text-xs text-zinc-400">
        <span>
          {summary.overallPercent}% — {summary.stage3Done} of {summary.total} devices confirmed
          playback
        </span>
        {isPublishing && (
          <span className="inline-flex items-center gap-1.5 text-indigo-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
            อัปเดตอัตโนมัติทุก 10 วินาที
          </span>
        )}
      </p>

      <div className="mb-5 overflow-x-auto">
        <DeliveryStages stages={stages} />
      </div>

      <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-500 sm:grid-cols-5">
        <div>
          <dt className="text-zinc-400">Connected</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100">{summary.connected}</dd>
        </div>
        <div>
          <dt className="text-zinc-400">Delivered</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100">{summary.delivered}</dd>
        </div>
        <div>
          <dt className="text-zinc-400">Downloading</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100">{summary.downloading}</dd>
        </div>
        <div>
          <dt className="text-zinc-400">Offline</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100">{summary.offline}</dd>
        </div>
        <div>
          <dt className="text-zinc-400">Failed</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100">{summary.failed}</dd>
        </div>
      </dl>

      {hasRetryableTargets && (
        <div className="mb-4 flex items-center gap-2">
          <Button variant="secondary" onClick={handleRetryAll} disabled={retrying}>
            {retrying ? "กำลัง Retry…" : "Retry Failed/Offline"}
          </Button>
          {retryError && <span className="text-xs text-red-600 dark:text-red-400">{retryError}</span>}
        </div>
      )}

      <DeliveryDeviceTable id={id} targets={targets} schedule={detail.schedule} onRetried={refresh} />
    </Card>
  );
}
