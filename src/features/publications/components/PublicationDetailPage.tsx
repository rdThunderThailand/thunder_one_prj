"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  cancelPublication,
  deletePublication,
  fetchPlaylist,
  fetchPublication,
} from "../services/publications-api";
import { publicationDisplayStatus, publicationStatusColor } from "../publication-status";
import type { PlaylistDetail, PublicationDetail } from "../types";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { NoAccess } from "@/components/ui/NoAccess";

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

export function PublicationDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<PublicationDetail | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [playlistError, setPlaylistError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ClassifiedError | null>(null);

  const [confirming, setConfirming] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    fetchPublication(id)
      .then((pubDetail) => {
        if (!alive) return;
        setDetail(pubDetail);
        setLoading(false);

        if (pubDetail.playlist?.id) {
          fetchPlaylist(pubDetail.playlist.id)
            .then((pl) => {
              if (alive) setPlaylist(pl);
            })
            .catch((err) => {
              if (alive) {
                setPlaylistError(
                  err instanceof Error ? err.message : "ไม่สามารถโหลด playlist ได้"
                );
              }
            });
        }
      })
      .catch((err) => {
        if (!alive) return;
        setError(classifyApiError(err, "โหลด publication ไม่สำเร็จ"));
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id]);

  const handleDelete = async () => {
    try {
      setActionBusy(true);
      setActionError(null);
      await deletePublication(id);
      router.push("/publications");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
      setActionBusy(false);
    }
  };

  const handleCancel = async () => {
    try {
      setActionBusy(true);
      setActionError(null);
      await cancelPublication(id);
      router.push("/publications");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "ยกเลิกไม่สำเร็จ");
      setActionBusy(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-center text-sm text-zinc-400">กำลังโหลด…</p>
      </Card>
    );
  }

  if (error || !detail) {
    return (
      <>
        {error?.kind === "forbidden" ? (
          <NoAccess message={error.message} />
        ) : (
          <Card className="p-6">
            <p className="text-center text-sm text-red-600 dark:text-red-400">
              {error ? error.message : "ไม่พบ publication"}
            </p>
          </Card>
        )}
        <div className="mt-4 flex justify-center">
          <Link href="/publications" className={buttonClasses("secondary")}>
            กลับไปยังรายการ
          </Link>
        </div>
      </>
    );
  }

  // Behaviour gates read the STORED status: whether this can be edited or
  // cancelled follows from whether an operator activated it, not from whether
  // the schedule window has since closed (docs/adr/0004).
  const isDraft = detail.status === "draft";
  const isActive = detail.status === "active";
  // The label, by contrast, is the clock-aware one.
  const displayStatus = publicationDisplayStatus(detail);
  const statusColor = publicationStatusColor(displayStatus);

  const playlistItems = playlist?.items
    ? [...playlist.items].sort((a, b) => a.position - b.position)
    : [];

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header */}
      <PageHeader
        title={detail.name}
        subtitle={`Status: ${displayStatus}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/publications" className={buttonClasses("secondary")}>
              กลับ
            </Link>

            {isDraft && (
              <Link
                href={`/publications/create?id=${id}`}
                className={buttonClasses("secondary")}
              >
                Edit
              </Link>
            )}

            {isDraft &&
              (confirming ? (
                <>
                  <Button
                    variant="primary"
                    disabled={actionBusy}
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-500 dark:bg-red-600"
                  >
                    {actionBusy ? "กำลังลบ…" : "ยืนยันลบ?"}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={actionBusy}
                    onClick={() => setConfirming(false)}
                  >
                    ไม่
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  disabled={actionBusy}
                  onClick={() => setConfirming(true)}
                  className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  Delete
                </Button>
              ))}

            {isActive &&
              (confirming ? (
                <>
                  <Button
                    variant="primary"
                    disabled={actionBusy}
                    onClick={handleCancel}
                    className="bg-red-600 hover:bg-red-500 dark:bg-red-600"
                  >
                    {actionBusy ? "กำลังยกเลิก…" : "ยืนยันยกเลิก?"}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={actionBusy}
                    onClick={() => setConfirming(false)}
                  >
                    ไม่
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  disabled={actionBusy}
                  onClick={() => setConfirming(true)}
                  className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  Cancel
                </Button>
              ))}
          </div>
        }
      />

      {actionError && (
        <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>
      )}

      {/* 2. Overview */}
      <Card className="p-5">
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Overview
        </h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs font-medium text-zinc-400">Status</dt>
            <dd className="mt-1">
              <Badge color={statusColor} variant="pill">
                {displayStatus}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-400">Type</dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
              {detail.publication_type}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-400">Priority</dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
              {detail.priority}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-400">Language</dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
              {detail.language ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-400">Campaign ID</dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
              {detail.campaign_id ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-400">Tags</dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
              {detail.tags && detail.tags.length > 0 ? detail.tags.join(", ") : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-400">Created At</dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
              {formatDate(detail.created_at)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-400">Activated At</dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
              {formatDate(detail.activated_at)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-400">Published By</dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
              {detail.published_by?.display_name ?? "ไม่ทราบผู้เผยแพร่"}
            </dd>
          </div>
          {detail.created_by && detail.created_by.id !== detail.published_by?.id ? (
            <div>
              <dt className="text-xs font-medium text-zinc-400">Created By</dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                {detail.created_by.display_name}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs font-medium text-zinc-400">Job Status</dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
              {detail.job_status ?? "—"}
            </dd>
          </div>
        </dl>
      </Card>

      {/* 3. Content */}
      <Card className="p-5">
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Content
        </h2>
        {playlistError ? (
          <p className="text-xs text-amber-600 dark:text-amber-500">{playlistError}</p>
        ) : playlistItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-400 dark:border-zinc-800">
                  <th className="py-2 pr-3">Position</th>
                  <th className="py-2 pr-3">Title / Media Asset ID</th>
                  <th className="py-2 text-right">Duration (s)</th>
                </tr>
              </thead>
              <tbody>
                {playlistItems.map((item, idx) => (
                  <tr
                    key={item.media_asset_id + idx}
                    className="border-t border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-400">
                      {item.position}
                    </td>
                    <td className="py-2.5 pr-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {item.title || item.media_asset_id}
                    </td>
                    <td className="py-2.5 text-right text-zinc-600 dark:text-zinc-400">
                      {item.duration_seconds ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">ไม่มีรายการคอนเทนต์</p>
        )}
      </Card>

      {/* 4. Channels */}
      <Card className="p-5">
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Channels
        </h2>
        {detail.publication_targets && detail.publication_targets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-400 dark:border-zinc-800">
                  <th className="py-2 pr-3">Name / Target ID</th>
                  <th className="py-2 text-right">Target Type</th>
                </tr>
              </thead>
              <tbody>
                {detail.publication_targets.map((target, idx) => (
                  <tr key={idx} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="py-2.5 pr-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {target.name ?? target.device_id ?? target.channel_id ?? "—"}
                    </td>
                    <td className="py-2.5 text-right text-zinc-600 dark:text-zinc-400">
                      {target.target_type}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">ไม่มีเป้าหมายการส่งสื่อ</p>
        )}
      </Card>

      {/* 5. Schedule */}
      <Card className="p-5">
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Schedule
        </h2>
        {detail.schedule ? (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs font-medium text-zinc-400">Starts At</dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                {formatDate(detail.schedule.starts_at)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-400">Ends At</dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                {formatDate(detail.schedule.ends_at)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-400">Timezone</dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                {detail.schedule.timezone}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-400">Recurrence</dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                {detail.schedule.recurrence && "freq" in detail.schedule.recurrence ? (
                  <>
                    <span>Days: {detail.schedule.recurrence.days.join(", ")}</span>
                    <br />
                    <span>
                      Hours: {detail.schedule.recurrence.daily_start}–
                      {detail.schedule.recurrence.daily_end}
                    </span>
                  </>
                ) : (
                  "One-time"
                )}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-zinc-400">ยังไม่ได้ตั้งเวลา</p>
        )}
      </Card>

      {/* 6. Delivery */}
      <Card className="p-5">
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Delivery
        </h2>
        {detail.targets && detail.targets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-400 dark:border-zinc-800">
                  <th className="py-2 pr-3">Device Name</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Attempt Count</th>
                  <th className="py-2 pr-3">Acked At</th>
                  <th className="py-2 text-right">Error Message</th>
                </tr>
              </thead>
              <tbody>
                {detail.targets.map((t, idx) => (
                  <tr key={idx} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="py-2.5 pr-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {t.device_name ?? t.device_id}
                    </td>
                    <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-400">
                      {t.status ?? "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-400">
                      {t.attempt_count ?? 0}
                    </td>
                    <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-400">
                      {formatDate(t.acked_at)}
                    </td>
                    <td className="py-2.5 text-right text-red-600 dark:text-red-400">
                      {t.error_message ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">ยังไม่มีข้อมูลการส่ง</p>
        )}
      </Card>
    </div>
  );
}
