"use client";

import { useEffect, useState } from "react";
import { fetchPublication } from "../services/publications-api";
import { summarizeDelivery } from "../delivery-progress";
import type { PublicationDetail } from "../types";

const POLL_INTERVAL_MS = 10_000;

/**
 * Keeps a publication's delivery status fresh while it's still settling. Re-fetches
 * `fetchPublication` on a timer and stops once the run reaches a final result (ADR 0021) —
 * an already-settled publication never polls at all.
 */
export function useDeliveryProgress(id: string, initialDetail?: PublicationDetail | null) {
  const [detail, setDetail] = useState<PublicationDetail | null>(initialDetail ?? null);
  const [loading, setLoading] = useState(!initialDetail);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let alive = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    function scheduleNext() {
      if (!alive) return;
      timeoutId = setTimeout(tick, POLL_INTERVAL_MS);
    }

    function tick() {
      if (document.hidden) {
        scheduleNext();
        return;
      }
      fetchPublication(id)
        .then((pubDetail) => {
          if (!alive) return;
          setDetail(pubDetail);
          setLoading(false);
          setError(null);
          const summary = summarizeDelivery(
            pubDetail.targets ?? [],
            pubDetail,
            pubDetail.schedule,
            new Date()
          );
          if (summary.result === "Publishing") scheduleNext();
        })
        .catch((err) => {
          if (!alive) return;
          setError(err instanceof Error ? err.message : "โหลดสถานะ delivery ไม่สำเร็จ");
          setLoading(false);
        });
    }

    // refreshToken > 0 means a caller asked for an immediate re-fetch (e.g. right after a
    // retry) — always tick in that case, even though initialDetail hasn't changed.
    if (initialDetail && refreshToken === 0) {
      const summary = summarizeDelivery(
        initialDetail.targets ?? [],
        initialDetail,
        initialDetail.schedule,
        new Date()
      );
      if (summary.result === "Publishing") scheduleNext();
    } else {
      tick();
    }

    return () => {
      alive = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [id, initialDetail, refreshToken]);

  const refresh = () => setRefreshToken((t) => t + 1);

  return { detail, loading, error, refresh };
}
