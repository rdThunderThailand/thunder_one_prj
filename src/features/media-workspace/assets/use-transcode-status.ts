"use client";

import { useEffect, useRef, useState } from "react";
import { fetchTranscodeStatus } from "@/lib/api/media-api";
import type { TranscodeStatus } from "@/types/domain";

const POLL_MS = 5000;

/** Polls Core for the given Assets, keyed by Asset id. Pass only Assets still converting: an empty
 *  list stops the polling, and so does an answer with no rows (every Asset was deleted). `onSettled`
 *  runs for an Asset that has left `processing`, so the caller should drop it from the list. */
export function useTranscodeStatus(assetIds: string[], onSettled?: (status: TranscodeStatus) => void) {
  const [statuses, setStatuses] = useState<Record<string, TranscodeStatus>>({});
  const onSettledRef = useRef(onSettled);
  const key = assetIds.join(",");

  useEffect(() => {
    onSettledRef.current = onSettled;
  }, [onSettled]);

  useEffect(() => {
    if (!key) return;
    let timer: ReturnType<typeof setTimeout>;
    let alive = true;
    const poll = () => {
      let isFinished = false;
      fetchTranscodeStatus(key.split(","))
        .then((rows) => {
          if (!alive) return;
          isFinished = rows.length === 0;
          setStatuses(Object.fromEntries(rows.map((row) => [row.asset_id, row])));
          rows.filter((row) => row.status !== "processing").forEach((row) => onSettledRef.current?.(row));
        })
        // A missed poll changes nothing on screen, and the next one tries again.
        .catch(() => undefined)
        .finally(() => {
          if (alive && !isFinished) timer = setTimeout(poll, POLL_MS);
        });
    };
    poll();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [key]);

  return statuses;
}
