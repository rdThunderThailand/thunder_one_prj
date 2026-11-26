"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { identifyAsset } from "../services/asset-lookup-client";
import { lookupQuerySchema, type LookupResult, type LookupType } from "../services/asset-lookup-contract";

export type AssetLookupState =
  | { phase: "input" }
  | { phase: "identifying"; code: string }
  | { phase: "result"; code: string; result: LookupResult };

export function useAssetLookup() {
  const [state, setState] = useState<AssetLookupState>({ phase: "input" });
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => request.current?.abort(), []);

  const reset = useCallback(() => {
    request.current?.abort();
    request.current = null;
    setState({ phase: "input" });
  }, []);

  const identify = useCallback(async (code: string, type: LookupType = "auto") => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const parsed = lookupQuerySchema.safeParse({ code, type });
    if (!parsed.success) {
      setState({ phase: "result", code, result: { kind: "invalid", status: 400, message: parsed.error.issues[0].message } });
      return;
    }
    setState({ phase: "identifying", code: parsed.data.code });
    try {
      const result = await identifyAsset(parsed.data, controller.signal);
      if (!controller.signal.aborted && request.current === controller) {
        setState({ phase: "result", code: parsed.data.code, result });
      }
    } catch {
      // Closing, rescanning or changing organization must never revive an old result.
      if (!controller.signal.aborted && request.current === controller) {
        setState({ phase: "result", code: parsed.data.code, result: { kind: "error", status: 503, message: "Couldn't identify this asset. Please try again." } });
      }
    }
  }, []);

  return { state, identify, reset };
}
