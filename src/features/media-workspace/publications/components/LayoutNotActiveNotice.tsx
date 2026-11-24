"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { classifyApiError } from "@/lib/api/api-error";
import { setCompositionStatus } from "@/features/media-workspace/compositions/services/compositions-api";
import type { LayoutPublishGate } from "../hooks/useLayoutPublishBlock";

/**
 * ADR 0114 §3: the Layout bound to this Program is not Active, so Core would refuse to publish it.
 * Offers the fix in place when every Zone is bound (Core checks nothing else on activate), and a
 * new-tab link to the Layout editor otherwise so the Draft is kept. Renders nothing when the gate is clear.
 */
export function LayoutNotActiveNotice({ compositionId, gate }: { compositionId: string; gate: LayoutPublishGate }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!gate.reason) return null;

  const activate = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await setCompositionStatus(compositionId, "active");
      gate.setStatus(result.status);
    } catch (err) {
      setError(classifyApiError(err, "Activate Layout ไม่สำเร็จ").message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-warning-muted px-4 py-3 text-sm text-warning"
    >
      <span>{gate.reason}</span>
      {gate.canActivate ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => void activate()}
          disabled={busy}
        >
          {busy ? "กำลัง Activate…" : "Activate Layout"}
        </Button>
      ) : (
        <Link
          href={`/media-workspace/layouts/${compositionId}`}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          ผูก Content ให้ครบทุก Zone ที่ Layout
        </Link>
      )}
      {error && <span className="w-full text-xs text-error">{error}</span>}
    </div>
  );
}
