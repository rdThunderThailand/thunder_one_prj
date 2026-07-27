"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { deletePublication, fetchDrafts } from "../services/publications-api";
import type { PublicationListItem } from "../types";

export function DraftList() {
  const [drafts, setDrafts] = useState<PublicationListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadDrafts = async () => {
      try {
        const list = await fetchDrafts();
        if (isMounted) {
          setDrafts(list);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load draft publications."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDrafts();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }

    setDeletingId(id);
    setError(null);

    try {
      await deletePublication(id);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete publication draft."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setConfirmDeleteId(null);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-zinc-500">
        Loading draft publications…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200 dark:bg-red-950/30 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
            {error}
          </p>
        </div>
      )}

      {drafts.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-3">
          <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
            ยังไม่มี draft
          </p>
          <div>
            <Link
              href="/publications/new"
              className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Create New Publication
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Tags</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Updated At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {drafts.map((draft) => (
                <tr
                  key={draft.id}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                    {draft.name}
                  </td>
                  <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 capitalize">
                    {draft.publication_type}
                  </td>
                  <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 capitalize">
                    {draft.priority}
                  </td>
                  <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                    {draft.tags && draft.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {draft.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 font-mono">
                    {draft.item_count ?? 0}
                  </td>
                  <td className="py-3 px-4 text-zinc-500 text-[11px]">
                    {formatDate(draft.updated_at || draft.created_at)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/publications/new?id=${draft.id}`}
                        className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                      >
                        Resume
                      </Link>

                      {confirmDeleteId === draft.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(draft.id)}
                            disabled={deletingId === draft.id}
                            className="rounded bg-red-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {deletingId === draft.id ? "Deleting…" : "Confirm?"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelDelete}
                            className="rounded border border-zinc-300 px-2 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDelete(draft.id)}
                          className="font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
