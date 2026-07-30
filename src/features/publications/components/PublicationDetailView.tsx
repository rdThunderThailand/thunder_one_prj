"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchMediaAssets, fetchPlaylist, fetchPublication } from "../services/publications-api";
import type { MediaAsset, PlaylistItem, PublicationDetail } from "../types";
import { usePreviewUrls } from "../hooks/usePreviewUrls";
import { MediaThumb } from "./MediaThumb";

type PublicationDetailViewProps = {
  id: string;
};

const THAI_DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
};

const DefRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-2 border-b border-zinc-100 pb-1.5 dark:border-zinc-800/60">
    <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
    <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right truncate max-w-[60%]">{value}</dd>
  </div>
);

export function PublicationDetailView({ id }: PublicationDetailViewProps) {
  const [detail, setDetail] = useState<PublicationDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [assetsById, setAssetsById] = useState<Record<string, MediaAsset>>({});

  useEffect(() => {
    let isMounted = true;
    const loadDetail = async () => {
      try {
        const data = await fetchPublication(id);
        if (isMounted) {
          setDetail(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load publication details."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDetail();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const playlistId = detail?.playlist?.id;
  useEffect(() => {
    if (!playlistId) return;
    let isMounted = true;
    fetchPlaylist(playlistId)
      .then((pl) => {
        if (isMounted) {
          setItems(pl?.items ?? []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setItems([]);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [playlistId]);

  useEffect(() => {
    let isMounted = true;
    fetchMediaAssets()
      .then((assets) => {
        if (isMounted) {
          setAssetsById(Object.fromEntries(assets.map((a) => [a.id, a])));
        }
      })
      .catch(() => {
        if (isMounted) {
          setAssetsById({});
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const assetIds = useMemo(() => items.map((i) => i.media_asset_id), [items]);
  const previews = usePreviewUrls(assetIds);

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-zinc-500">
        กำลังโหลดข้อมูล…
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="rounded-md bg-red-50 p-4 border border-red-200 dark:bg-red-950/30 dark:border-red-800">
        <p className="text-sm text-red-700 dark:text-red-300 font-medium">
          {error || "ไม่พบข้อมูล Publication"}
        </p>
      </div>
    );
  }

  const schedule = detail.schedule;
  const recurrenceText =
    schedule?.recurrence && "freq" in schedule.recurrence
      ? `รายสัปดาห์: ${schedule.recurrence.days.map((d) => THAI_DAYS[d] ?? d).join(", ")} เวลา ${schedule.recurrence.daily_start}–${schedule.recurrence.daily_end}`
      : "ครั้งเดียว";

  const targets = detail.publication_targets ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {detail.name}
        </h1>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 capitalize">
          {detail.status}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 1. ภาพรวม (Summary) */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">ภาพรวม</h3>
          <dl className="space-y-2 text-sm">
            <DefRow label="Status" value={detail.status} />
            <DefRow label="Type" value={detail.publication_type} />
            <DefRow label="Priority" value={detail.priority} />
            <DefRow label="Language" value={detail.language ?? "—"} />
            <DefRow label="Playlist" value={detail.playlist?.name ?? "—"} />
            <DefRow label="Description" value={detail.description ?? "—"} />
            <DefRow label="Created" value={formatDate(detail.created_at)} />
            <DefRow label="Activated" value={formatDate(detail.activated_at)} />
            <DefRow label="Job Status" value={detail.job_status ?? "—"} />
          </dl>
        </div>

        {/* 2. คอนเทนต์ (Content) */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">คอนเทนต์</h3>
          {items.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">ไม่มีคอนเทนต์</p>
          ) : (
            <div className="space-y-3">
              {items.map((it) => (
                <div
                  key={it.media_asset_id + it.position}
                  className="flex items-center gap-3 rounded-md border border-zinc-100 bg-zinc-50 p-2.5 text-sm dark:border-zinc-800/60 dark:bg-zinc-800/40"
                >
                  <MediaThumb
                    url={previews[it.media_asset_id]}
                    mimeType={assetsById[it.media_asset_id]?.file?.mime_type}
                    kind={assetsById[it.media_asset_id]?.kind}
                    alt={it.title ?? it.media_asset_id}
                    className="h-12 w-12"
                  />
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="font-mono text-zinc-400 font-bold text-xs shrink-0">#{it.position}</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {it.title ?? it.media_asset_id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. กำหนดการเผยแพร่ (Schedule) */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">กำหนดการเผยแพร่</h3>
          {!schedule ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">ยังไม่ได้ตั้งเวลา</p>
          ) : (
            <dl className="space-y-2 text-sm">
              <DefRow label="วันเริ่มต้น" value={formatDate(schedule.starts_at)} />
              <DefRow label="วันสิ้นสุด" value={schedule.ends_at ? formatDate(schedule.ends_at) : "ไม่มี (เผยแพร่ต่อเนื่อง)"} />
              <DefRow label="เขตเวลา" value={schedule.timezone} />
              <DefRow label="การเล่นซ้ำ" value={recurrenceText} />
            </dl>
          )}
        </div>

        {/* 4. ช่องทางและอุปกรณ์ (Targets) */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">ช่องทางและอุปกรณ์</h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{targets.length} Device(s)</span>
          </div>
          {targets.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">ไม่มีอุปกรณ์</p>
          ) : (
            <div className="space-y-2">
              {targets.map((t, idx) => (
                <div
                  key={t.device_id ?? t.channel_id ?? idx}
                  className="rounded-md border border-zinc-100 bg-zinc-50 p-2.5 text-sm dark:border-zinc-800/60 dark:bg-zinc-800/40 text-zinc-900 dark:text-zinc-100 font-medium truncate"
                >
                  {t.name || t.device_id || t.channel_id || "—"}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. Tags */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Tags</h3>
          {detail.tags && detail.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {detail.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">—</p>
          )}
        </div>
      </div>
    </div>
  );
}
