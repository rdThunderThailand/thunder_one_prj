"use client";

import { useEffect, useState } from "react";
import { fetchPublication } from "../services/publications-api";
import { deliveryPollIntervalMs, summarizeDelivery } from "../delivery-progress";
import type { PublicationDetail } from "../types";

/**
 * Keeps a publication's delivery status fresh while delivery/playback can still advance.
 * The interval adapts to the playback window and pauses entirely while the tab is hidden.
 */
export function useDeliveryProgress(id: string, initialDetail?: PublicationDetail | null) {
  const [detail, setDetail] = useState<PublicationDetail | null>(initialDetail ?? null);
  const [loading, setLoading] = useState(!initialDetail);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let alive = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    function scheduleNext(delayMs: number) {
      if (!alive || document.hidden) return;
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(tick, delayMs);
    }

    function tick() {
      if (document.hidden) return;
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
          const nextInterval = deliveryPollIntervalMs(
            pubDetail.targets ?? [],
            pubDetail,
            summary
          );
          if (nextInterval !== null) scheduleNext(nextInterval);
        })
        .catch((err) => {
          if (!alive) return;
          setError(err instanceof Error ? err.message : "โหลดสถานะ delivery ไม่สำเร็จ");
          setLoading(false);
        });
    }

    function handleVisibilityChange() {
      if (!alive) return;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (!document.hidden) tick();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // refreshToken > 0 means a caller asked for an immediate re-fetch (e.g. right after a
    // retry) — always tick in that case, even though initialDetail hasn't changed.
    if (initialDetail && refreshToken === 0) {
      const summary = summarizeDelivery(
        initialDetail.targets ?? [],
        initialDetail,
        initialDetail.schedule,
        new Date()
      );
      const nextInterval = deliveryPollIntervalMs(
        initialDetail.targets ?? [],
        initialDetail,
        summary
      );
      if (nextInterval !== null) scheduleNext(nextInterval);
    } else {
      tick();
    }

    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [id, initialDetail, refreshToken]);

  const refresh = () => setRefreshToken((t) => t + 1);

  return { detail, loading, error, refresh };
}
