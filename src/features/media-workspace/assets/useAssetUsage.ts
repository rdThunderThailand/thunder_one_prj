"use client";

import { useEffect, useState } from "react";
import { fetchAssetUsage } from "@/lib/api/media-api";
import type { AssetUsage } from "@/types/domain";

type State = { key: string; usage: Record<string, AssetUsage> | null };

/**
 * Usage for the given Asset ids, refetched whenever the set changes or `enabled` flips on, so a
 * dialog that opens reads current data (ADR 0091). `failed` lets callers fall back to a plain
 * confirm — Usage is advisory for Trash, never a gate.
 */
export function useAssetUsage(ids: string[], enabled = true) {
  const key = enabled ? [...ids].sort().join(",") : "";
  const [state, setState] = useState<State>({ key: "", usage: null });

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    fetchAssetUsage(key.split(","))
      .then((usage) => {
        if (!cancelled) setState({ key, usage });
      })
      .catch(() => {
        if (!cancelled) setState({ key, usage: null });
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const settled = key !== "" && state.key === key;
  return { usage: settled ? state.usage : null, loading: key !== "" && !settled, failed: settled && state.usage === null };
}
