"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import {
  cancelPublication,
  deletePublication,
  duplicatePublication,
  fetchPublications,
} from "../services/publications-api";
import {
  isPastPublication,
  publicationDisplayStatus,
  publicationStatusColor,
} from "../publication-status";
import type { PublicationListItem } from "../types";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { NoAccess } from "@/components/ui/NoAccess";

export function PublicationsListPage() {
  const router = useRouter();
  // One read of every row (the RPC accepts a null status); the three tabs are a
  // client-side split on the stored `status`. Not `effective_status` — that is a
  // separate clock-aware layer `isPastPublication` applies on top, and the RPC's
  // own predicate is on `status`.
  const [items, setItems] = useState<PublicationListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  // One call, so one error state — a failed load empties every tab together
  // rather than leaving some silently blank (ADR 0065 §1).
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const drafts = items?.filter((item) => item.status === "draft") ?? null;
  const activeRows = items?.filter((item) => item.status === "active") ?? null;
  const cancelledRows = items?.filter((item) => item.status === "cancelled") ?? null;

  // "Active" keeps ADR 0004's meaning (scheduled/active only); ended rows move to
  // "Inactive" alongside cancelled ones instead, per ADR 0015.
  const activeOnly = activeRows?.filter((item) => !isPastPublication(item)) ?? null;
  const inactive =
    activeRows && cancelledRows
      ? [...activeRows.filter(isPastPublication), ...cancelledRows]
      : null;

  useEffect(() => {
    let alive = true;

    fetchPublications()
      .then((rows) => {
        if (!alive) return;
        setItems(rows);
        setLoading(false);
      })
      .catch((reason) => {
        if (!alive) return;
        setError(classifyApiError(reason, "โหลด publication ไม่สำเร็จ"));
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const handleDelete = async (id: string) => {
    try {
      setBusyId(id);
      setActionError(null);
      await deletePublication(id);
      setItems((prev) => (prev ? prev.filter((item) => item.id !== id) : null));
      setConfirmingId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setBusyId(id);
      setActionError(null);
      await cancelPublication(id);
      setItems((prev) => (prev ? prev.filter((item) => item.id !== id) : null));
      setConfirmingId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "ยกเลิกไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      setBusyId(id);
      setActionError(null);
      const res = await duplicatePublication(id);
      router.push(`/media-workspace/publications/create?id=${res.publication_id}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "ทำสำเนาไม่สำเร็จ");
      setBusyId(null);
    }
  };

  const renderTable = (
    rows: PublicationListItem[] | null,
    tab: "draft" | "active" | "inactive"
  ) => {
    if (loading) {
      return <p className="py-6 text-center text-sm text-zinc-400">กำลังโหลด…</p>;
    }
    if (error) {
      if (error.kind === "forbidden") {
        return <NoAccess message={error.message} />;
      }
      return (
        <p className="py-6 text-center text-sm text-red-600 dark:text-red-400">
          {error.message}
        </p>
      );
    }
    if (!rows || rows.length === 0) {
      return (
        <p className="py-6 text-center text-sm text-zinc-400">
          {tab === "draft"
            ? "ไม่มี publication ดราฟต์"
            : tab === "active"
              ? "ไม่มี publication ที่ใช้งานอยู่"
              : "ไม่มี publication ที่จบหรือถูกยกเลิก"}
        </p>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-400 dark:border-zinc-800">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">Priority</th>
              <th className="py-2 pr-3">Items</th>
              <th className="py-2 pr-3">Created by</th>
              <th className="py-2 pr-3">Updated</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const updatedStr = item.updated_at || item.created_at;
              const updatedDisplay = updatedStr ? new Date(updatedStr).toLocaleString() : "—";
              const isConfirming = confirmingId === item.id;
              const isBusy = busyId === item.id;

              return (
                <tr
                  key={item.id}
                  className="border-t border-zinc-100 dark:border-zinc-800"
                >
                  <td className="py-2.5 pr-3">
                    <Link
                      href={`/media-workspace/publications/${item.id}`}
                      className="font-medium text-zinc-900 hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400"
                    >
                      {item.name}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-3">
                    <Badge
                      color={publicationStatusColor(publicationDisplayStatus(item))}
                      variant="pill"
                    >
                      {publicationDisplayStatus(item)}
                    </Badge>
                  </td>
                  <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-400">
                    {item.publication_type}
                  </td>
                  <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-400">
                    {item.priority}
                  </td>
                  <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-400">
                    {item.item_count ?? 0}
                  </td>
                  <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-400">
                    {item.created_by?.display_name ?? "—"}
                  </td>
                  <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-400">
                    {updatedDisplay}
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {tab === "draft" && (
                        <Link
                          href={`/media-workspace/publications/create?id=${item.id}`}
                          className={buttonClasses("secondary", "text-xs px-2.5 py-1")}
                        >
                          Edit
                        </Link>
                      )}

                      {tab === "draft" &&
                        (isConfirming ? (
                          <>
                            <Button
                              variant="primary"
                              disabled={isBusy}
                              onClick={() => handleDelete(item.id)}
                              className="bg-red-600 hover:bg-red-500 dark:bg-red-600 text-xs px-2.5 py-1"
                            >
                              {isBusy ? "กำลังลบ…" : "ยืนยันลบ?"}
                            </Button>
                            <Button
                              variant="secondary"
                              disabled={isBusy}
                              onClick={() => setConfirmingId(null)}
                              className="text-xs px-2.5 py-1"
                            >
                              ไม่
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            disabled={isBusy}
                            onClick={() => setConfirmingId(item.id)}
                            className="text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 px-2.5 py-1"
                          >
                            Delete
                          </Button>
                        ))}

                      {tab === "active" &&
                        (isConfirming ? (
                          <>
                            <Button
                              variant="primary"
                              disabled={isBusy}
                              onClick={() => handleCancel(item.id)}
                              className="bg-red-600 hover:bg-red-500 dark:bg-red-600 text-xs px-2.5 py-1"
                            >
                              {isBusy ? "กำลังยกเลิก…" : "ยืนยันยกเลิก?"}
                            </Button>
                            <Button
                              variant="secondary"
                              disabled={isBusy}
                              onClick={() => setConfirmingId(null)}
                              className="text-xs px-2.5 py-1"
                            >
                              ไม่
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            disabled={isBusy}
                            onClick={() => setConfirmingId(item.id)}
                            className="text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 px-2.5 py-1"
                          >
                            Cancel
                          </Button>
                        ))}

                      {(tab === "active" || tab === "inactive") && !isConfirming && (
                        <Button
                          variant="secondary"
                          disabled={isBusy}
                          onClick={() => handleDuplicate(item.id)}
                          className="text-xs px-2.5 py-1"
                        >
                          {isBusy ? "กำลังทำสำเนา…" : "Duplicate"}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Publications"
        subtitle="จัดการ publication ที่บันทึกและเผยแพร่ไว้"
        actions={
          <Link href="/media-workspace/publications/create" className={buttonClasses("primary")}>
            Create Publication
          </Link>
        }
      />

      <Card className="p-5">
        {actionError && (
          <p className="mb-3 text-sm text-red-600 dark:text-red-400">{actionError}</p>
        )}
        <Tabs
          items={[
            {
              key: "drafts",
              label: `Drafts (${drafts ? drafts.length : 0})`,
              content: renderTable(drafts, "draft"),
            },
            {
              key: "active",
              label: `Active (${activeOnly ? activeOnly.length : 0})`,
              content: renderTable(activeOnly, "active"),
            },
            {
              key: "inactive",
              label: `Inactive (${inactive ? inactive.length : 0})`,
              content: renderTable(inactive, "inactive"),
            },
          ]}
        />
      </Card>
    </div>
  );
}
