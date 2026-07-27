"use client";

import { useEffect, useMemo, useState } from "react";
import type { BasicInfoForm, Campaign, ContentItem, MediaAsset, PublicationTarget, ScheduleConflict, ScheduleForm, Screen } from "../types";
import { isScheduleFormValid, scheduleFormToPayload, WEEKDAYS } from "../schedule";
import { checkScheduleConflicts } from "../services/publications-api";
import { ScheduleCalendar } from "./ScheduleCalendar";
import { usePreviewUrls } from "../hooks/usePreviewUrls";
import { MediaThumb } from "./MediaThumb";

type ReviewStepProps = {
  form: BasicInfoForm;
  campaigns: Campaign[];
  contentItems: ContentItem[];
  mediaAssets: MediaAsset[];
  targets: PublicationTarget[];
  screens: Screen[];
  scheduleForm: ScheduleForm;
  publicationId: string | null;
};

export function ReviewStep({ form, campaigns, contentItems, mediaAssets, targets, screens, scheduleForm, publicationId }: ReviewStepProps) {
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [checking, setChecking] = useState<boolean>(false);

  const deviceIds = useMemo(() => targets.map((t) => t.device_id).filter((id): id is string => Boolean(id)), [targets]);
  const deviceIdsKey = useMemo(() => deviceIds.join(","), [deviceIds]);
  const isValid = useMemo(() => isScheduleFormValid(scheduleForm), [scheduleForm]);

  useEffect(() => {
    if (deviceIds.length === 0 || !isValid) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setChecking(true);
      const payload = scheduleFormToPayload(scheduleForm);
      checkScheduleConflicts({ publication_id: publicationId, device_ids: deviceIds, starts_at: payload.starts_at, ends_at: payload.ends_at })
        .then((res) => { if (!cancelled) { setConflicts(res); setChecking(false); } })
        .catch(() => { if (!cancelled) { setConflicts([]); setChecking(false); } });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [scheduleForm, deviceIdsKey, deviceIds, publicationId, isValid]);

  const sortedContent = useMemo(() => [...contentItems].sort((a, b) => a.position - b.position), [contentItems]);
  const assetIds = useMemo(() => sortedContent.map((i) => i.media_asset_id), [sortedContent]);
  const previews = usePreviewUrls(assetIds);
  const campaignName = useMemo(() => campaigns.find((c) => c.id === form.campaign_id)?.name ?? "—", [campaigns, form.campaign_id]);
  const offlineWarningCount = useMemo(() => targets.filter((t) => {
    const s = screens.find((sc) => sc.id === t.device_id);
    return s?.status_level === "offline" || s?.status_level === "warning";
  }).length, [targets, screens]);

  const isNoAssetType = form.publication_type === "html" || form.publication_type === "dynamic";
  const checklist = [
    { pass: form.name.trim().length > 0, label: "ตั้งชื่อ Publication แล้ว" },
    // html/dynamic publications carry no media asset, so step 2 is skipped for them.
    { pass: isNoAssetType || contentItems.length > 0, label: "เลือกคอนเทนต์แล้ว" },
    { pass: targets.length > 0, label: "เลือกช่องทางและอุปกรณ์แล้ว" },
    { pass: isValid, label: "กำหนดวันเวลาถูกต้อง" },
    { pass: conflicts.length === 0, label: "ไม่พบความขัดแย้งของตารางเผยแพร่" },
  ];
  const failedCount = checklist.filter((item) => !item.pass).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Review & Publish</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">ตรวจสอบรายละเอียดก่อนเผยแพร่สื่อ</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card 1 — Content */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Content</h3>
          {sortedContent.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">ยังไม่ได้เลือกคอนเทนต์</p>
          ) : (
            <div className="space-y-3">
              {sortedContent.map((item) => {
                const asset = mediaAssets.find((a) => a.id === item.media_asset_id);
                const title = asset?.title || asset?.file?.original_filename || item.media_asset_id;
                const dur = formatDuration(item.duration_seconds ?? asset?.duration_seconds);
                const dim = asset?.width && asset?.height ? `${asset.width}×${asset.height}` : null;
                const size = asset?.file?.file_size_bytes != null ? `${(asset.file.file_size_bytes / 1024 / 1024).toFixed(1)} MB` : null;
                return (
                  <div key={item.media_asset_id + item.position} className="flex items-center gap-3 rounded-md border border-zinc-100 bg-zinc-50 p-3 text-sm dark:border-zinc-800/60 dark:bg-zinc-800/40">
                    <MediaThumb url={previews[item.media_asset_id]} kind={asset?.kind} mimeType={asset?.file?.mime_type} alt={title} className="h-12 w-12" />
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{item.position}. {title}</span>
                        {asset?.kind && <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-mono uppercase text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">{asset.kind}</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-3 text-xs text-zinc-500 dark:text-zinc-400">
                        {dur && <span>ความยาว: {dur}</span>}
                        {dim && <span>ขนาด: {dim}</span>}
                        {size && <span>ไฟล์: {size}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Card 2 — กำหนดการเผยแพร่ */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">กำหนดการเผยแพร่</h3>
          <dl className="space-y-2 text-sm">
            <DefRow label="รูปแบบ" value={SCHEDULE_TYPE_THAI[scheduleForm.schedule_type]} />
            <DefRow label="วันที่เริ่มต้น" value={`${scheduleForm.start_date} เวลา ${scheduleForm.start_time}`} />
            <DefRow label="วันที่สิ้นสุด" value={scheduleForm.end_date ? `${scheduleForm.end_date} เวลา ${scheduleForm.end_time}` : "ไม่มี (เผยแพร่ต่อเนื่อง)"} />
            <DefRow label="เขตเวลา" value={scheduleForm.timezone} />
            {scheduleForm.schedule_type === "recurring" && (
              <>
                <DefRow label="วันที่เล่น" value={scheduleForm.days.map((d) => WEEKDAYS.find((w) => w.value === d)?.label ?? d).join(", ")} />
                <DefRow label="ช่วงเวลาเล่น" value={`${scheduleForm.daily_start} – ${scheduleForm.daily_end}`} />
              </>
            )}
          </dl>
          <div className="mt-4"><ScheduleCalendar form={scheduleForm} conflicts={conflicts} /></div>
        </div>

        {/* Card 3 — ช่องทางและอุปกรณ์ */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">ช่องทางและอุปกรณ์</h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">ทั้งหมด {targets.length} Devices</span>
          </div>
          {targets.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">ยังไม่ได้เลือกอุปกรณ์</p>
          ) : (
            <div className="space-y-2">
              {targets.map((t, idx) => {
                const screen = screens.find((s) => s.id === t.device_id);
                const name = screen?.name || t.name || t.device_id || "Unknown Device";
                return (
                  <div key={t.device_id ?? t.channel_id ?? idx} className="flex items-center justify-between rounded-md border border-zinc-100 bg-zinc-50 p-2.5 text-sm dark:border-zinc-800/60 dark:bg-zinc-800/40">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{name}</span>
                    <StatusBadge statusLevel={screen?.status_level} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Card 4 — Publication Summary */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Publication Summary</h3>
          <dl className="space-y-2 text-sm">
            <DefRow label="Campaign" value={campaignName} />
            <DefRow label="Publication Type" value={form.publication_type ?? "—"} />
            <DefRow label="Channels" value={`${targets.length} devices`} />
            <DefRow label="Schedule" value={`${scheduleForm.start_date} ${scheduleForm.start_time} (${scheduleForm.timezone})`} />
            <DefRow label="Expiration" value={scheduleForm.end_date ? `${scheduleForm.end_date} ${scheduleForm.end_time}` : "ไม่มี"} />
            <DefRow label="Priority" value={form.priority ?? "—"} />
            <DefRow label="Tags" value={form.tags && form.tags.length > 0 ? form.tags.join(", ") : "—"} />
            <DefRow label="Language" value={form.language ?? "—"} />
            <DefRow label="Description" value={form.description ?? "—"} />
          </dl>
        </div>

        {/* Card 5 — Pre-Publish Checklist */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Pre-Publish Checklist</h3>
            {failedCount === 0 ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">Passed All Checks</span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">{failedCount} รายการต้องแก้</span>
            )}
          </div>
          <ul className="space-y-2.5 text-sm">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                {item.pass ? <span className="font-bold text-emerald-600 dark:text-emerald-400">✓</span> : <span className="font-bold text-red-600 dark:text-red-400">✗</span>}
                <span className={item.pass ? "text-zinc-700 dark:text-zinc-300" : "font-medium text-zinc-900 dark:text-zinc-100"}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Card 6 — Conflicts & Warnings */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Conflicts & Warnings</h3>
          {checking ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">กำลังตรวจสอบ…</p>
          ) : (
            <div className="space-y-3">
              {conflicts.length === 0 ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                  No Schedule Conflicts / ไม่พบความขัดแย้งในช่วงเวลาที่เลือก
                </div>
              ) : (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200 space-y-2">
                  <p className="font-semibold">พบความขัดแย้งตารางเวลา ({conflicts.length}):</p>
                  {conflicts.map((c, i) => (
                    <div key={c.publication_id + i} className="border-t border-amber-200/60 pt-1.5 dark:border-amber-800/60">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-amber-800 dark:text-amber-300">{new Date(c.starts_at).toLocaleString()} – {c.ends_at ? new Date(c.ends_at).toLocaleString() : "ไม่มีวันสิ้นสุด"}</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400">Devices: {c.screens.join(", ")}</p>
                    </div>
                  ))}
                </div>
              )}
              {offlineWarningCount > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                  Device Offline ({offlineWarningCount}) — อุปกรณ์ที่เลือกบางเครื่องออฟไลน์อยู่
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Helpers ---

const SCHEDULE_TYPE_THAI: Record<ScheduleForm["schedule_type"], string> = {
  now: "เผยแพร่ทันที",
  later: "ตั้งเวลา",
  range: "ช่วงวันที่",
  recurring: "เล่นซ้ำรายสัปดาห์",
};

const formatDuration = (sec?: number | null): string | null => {
  if (sec == null) return null;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

const DefRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-2 border-b border-zinc-100 pb-1.5 dark:border-zinc-800/60">
    <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
    <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right truncate max-w-[60%]">{value}</dd>
  </div>
);

const StatusBadge = ({ statusLevel }: { statusLevel?: Screen["status_level"] }) => {
  if (statusLevel === "online") {
    return <span className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-500" />Online</span>;
  }
  if (statusLevel === "warning") {
    return <span className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400"><span className="h-2 w-2 rounded-full bg-amber-500" />Warning</span>;
  }
  if (statusLevel === "offline") {
    return <span className="flex items-center gap-1.5 text-xs text-red-700 dark:text-red-400"><span className="h-2 w-2 rounded-full bg-red-500" />Offline</span>;
  }
  return <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400"><span className="h-2 w-2 rounded-full bg-zinc-400" />Unknown</span>;
};
