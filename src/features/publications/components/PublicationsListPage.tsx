"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import {
  cancelPublication,
  deletePublication,
  fetchPublications,
} from "../services/publications-api";
import { publicationDisplayStatus, publicationStatusColor } from "../publication-status";
import type { PublicationListItem } from "../types";

export function PublicationsListPage() {
  const [drafts, setDrafts] = useState<PublicationListItem[] | null>(null);
  const [active, setActive] = useState<PublicationListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  // Per-tab, so one failing list cannot make the other read as empty.
  const [draftError, setDraftError] = useState<string | null>(null);
  const [activeError, setActiveError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    Promise.allSettled([fetchPublications("draft"), fetchPublications("active")]).then(
      ([draftRes, activeRes]) => {
        if (!alive) return;

        if (draftRes.status === "fulfilled") setDrafts(draftRes.value);
        else
          setDraftError(
            draftRes.reason instanceof Error ? draftRes.reason.message : "โหลดดราฟต์ไม่สำเร็จ"
          );

        if (activeRes.status === "fulfilled") setActive(activeRes.value);
        else
          setActiveError(
            activeRes.reason instanceof Error ? activeRes.reason.message : "โหลด active ไม่สำเร็จ"
          );

        setLoading(false);
      }
    );

    return () => {
      alive = false;
    };
  }, []);

  const handleDelete = async (id: string) => {
    try {
      setBusyId(id);
      setActionError(null);
      await deletePublication(id);
      setDrafts((prev) => (prev ? prev.filter((item) => item.id !== id) : null));
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
      setActive((prev) => (prev ? prev.filter((item) => item.id !== id) : null));
      setConfirmingId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "ยกเลิกไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  const renderTable = (
    items: PublicationListItem[] | null,
    tab: "draft" | "active",
    error: string | null
  ) => {
    if (loading) {
      return <p className="py-6 text-center text-sm text-zinc-400">กำลังโหลด…</p>;
    }
    if (error) {
      return <p className="py-6 text-center text-sm text-red-600 dark:text-red-400">{error}</p>;
    }
    if (!items || items.length === 0) {
      return (
        <p className="py-6 text-center text-sm text-zinc-400">
          {tab === "draft" ? "ไม่มี publication ดราฟต์" : "ไม่มี publication ที่ใช้งานอยู่"}
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
              <th className="py-2 pr-3">Updated</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
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
                      href={`/publications/${item.id}`}
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
                    {updatedDisplay}
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {tab === "draft" && (
                        <Link
                          href={`/publications/create?id=${item.id}`}
                          className={buttonClasses("secondary", "text-xs px-2.5 py-1")}
                        >
                          Edit
                        </Link>
                      )}

                      {tab === "draft" ? (
                        isConfirming ? (
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
                        )
                      ) : isConfirming ? (
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
          <Link href="/publications/create" className={buttonClasses("primary")}>
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
              content: renderTable(drafts, "draft", draftError),
            },
            {
              key: "active",
              label: `Active (${active ? active.length : 0})`,
              content: renderTable(active, "active", activeError),
            },
          ]}
        />
      </Card>
    </div>
  );
}
