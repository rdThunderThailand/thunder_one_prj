"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { fetchCompositions } from "@/features/media-workspace/compositions/services/compositions-api";
import type { CompositionListItem } from "@/features/media-workspace/compositions/types";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";

/** Step 2 for publication_type = 'composition' (ADR 0049 §5). A Composition Publication
 *  picks one Composition exactly as it picks one Playlist — there is no per-Zone binding
 *  UI here, that lives on the Composition itself (ADR 0052). */
export function CompositionPicker() {
  const compositionId = usePublicationDraftStore((s) => s.compositionId);
  const setCompositionId = usePublicationDraftStore((s) => s.setCompositionId);

  const [compositions, setCompositions] = useState<CompositionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchCompositions()
      .then((items) => {
        if (!alive) return;
        setCompositions(items.filter((item) => item.status === "active"));
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setCompositions([]);
        setError(err instanceof Error ? err.message : "โหลด Layout ไม่สำเร็จ");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <p className="text-sm text-zinc-400">กำลังโหลด Layout...</p>;

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  if (compositions.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-zinc-500">
        ยังไม่มี Layout ที่ Active
        <Link href="/media-workspace/layouts/create" target="_blank" className="ml-1 text-indigo-600 hover:underline">
          สร้าง Layout ใหม่
        </Link>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {compositions.map((composition) => {
        const selected = compositionId === composition.id;
        return (
          <button
            key={composition.id}
            type="button"
            onClick={() => setCompositionId(selected ? null : composition.id)}
            className={`rounded-xl border p-4 text-left transition-colors ${
              selected
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
            }`}
          >
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{composition.name}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {composition.layout_name} · {composition.bound_count}/{composition.zone_count} Zone ผูกแล้ว
            </p>
          </button>
        );
      })}
    </div>
  );
}
