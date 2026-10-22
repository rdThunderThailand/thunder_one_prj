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
  deliveryPollIntervalMs,
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

const RESULT_LABEL: Record<PublishResult, string> = {
  Publishing: "กำลังเผยแพร่",
  "Published Successfully": "ขึ้นจอครบแล้ว",
  "Completed with Warnings": "ขึ้นจอไม่ครบ",
  "Publish Failed": "เผยแพร่ไม่สำเร็จ",
  Cancelled: "ยกเลิกแล้ว",
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
        <h2 className="mb-4 text-base font-semibold text-foreground">
          ความคืบหน้าการส่ง
        </h2>
        <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลการส่ง</p>
      </Card>
    );
  }

  const now = new Date();
  const summary = summarizeDelivery(targets, detail, detail.schedule, now);
  const rows = buildDeliveryRows(targets, detail.schedule, now, detail.playback_window);
  const retryableCount = rows.filter(({ progress }) => canRetryTarget(progress)).length;
  const pollInterval = deliveryPollIntervalMs(targets, detail, summary);

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
    { label: "เตรียมไฟล์แล้ว", caption: "เสร็จแล้ว", state: mediaState },
    {
      label: "ส่งถึงเครื่อง",
      caption: `${summary.stage2Done}/${summary.total} เครื่อง`,
      state: deliverState,
    },
    {
      label: "ยืนยันการเล่น",
      caption: `${summary.stage3Done}/${summary.total} เครื่อง`,
      state: playbackState,
    },
  ];

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-foreground">ความคืบหน้าการส่ง</h2>
          <p className="text-xs text-muted-foreground">
            เผยแพร่เมื่อ {formatDate(detail.activated_at)} · {summary.total} เครื่อง
            {summary.completedAt && <> · เสร็จเมื่อ {formatDate(summary.completedAt)}</>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {retryableCount > 0 && (
            <Button
              variant="secondary"
              onClick={handleRetryAll}
              disabled={retrying}
            >
              {retrying ? "กำลังส่งใหม่…" : `ลองส่งใหม่ (${retryableCount} เครื่อง)`}
            </Button>
          )}
          <Badge color={RESULT_BADGE[summary.result]} variant="pill">
            {RESULT_LABEL[summary.result]}
          </Badge>
        </div>
      </div>
      {retryError && <p className="mb-2 text-xs text-error">{retryError}</p>}

      <ProgressBar
        value={summary.overallPercent}
        color={summary.failed > 0 ? "amber" : "indigo"}
        className="mb-2"
        animated={isPublishing}
      />
      <p className="mb-5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
        <span>
          ยืนยันการเล่นแล้ว {summary.stage3Done} จาก {summary.total} เครื่อง ({summary.overallPercent}%)
        </span>
        {pollInterval !== null && (
          <span className="inline-flex items-center gap-1.5 text-primary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            อัปเดตอัตโนมัติทุก {pollInterval / 1000} วินาที
          </span>
        )}
      </p>

      <div className="mb-5 overflow-x-auto">
        <DeliveryStages stages={stages} />
      </div>

      <DeliveryDeviceTable
        id={id}
        targets={targets}
        schedule={detail.schedule}
        playbackWindow={detail.playback_window}
        onRetried={refresh}
      />
    </Card>
  );
}
