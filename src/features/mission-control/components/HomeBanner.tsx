"use client";

import { useEffect, useState } from "react";
import { ArrowRightIcon, LightningIcon, XIcon } from "@/components/ui/icons";

const DISMISS_KEY = "thunderone-home-banner-dismissed";

// A real, working dismiss (persisted per-browser via localStorage) — this is
// what the mockup's "ตัวอย่าง disable" annotation on the close button is
// pointing at; it must actually hide the banner, not just be decorative.
//
// `dismissed` starts `false` unconditionally so the very first client render
// matches the server's (which has no access to localStorage and so can only
// ever render "not dismissed") — reading localStorage inside the `useState`
// initializer, as this component did before, made the client's *first*
// render disagree with the server's whenever the flag was already set,
// which is exactly a hydration mismatch. Syncing the real value in a
// `useEffect` instead (runs only after hydration completes) fixes that; the
// cost is a previously-dismissed banner can flash for a frame on
// navigation, an accepted tradeoff for a non-critical dismissible banner.
export function HomeBanner() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      // One-time correction of a browser-only value (localStorage) the
      // server could never have known — exactly the "external system"
      // exception react-hooks/set-state-in-effect itself carves out
      // (synchronizing from a source outside React), not a synchronous
      // render-loop hazard: empty deps, runs once, no re-subscription.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (window.localStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
    } catch {
      // Private browsing / storage disabled — stays not-dismissed.
    }
  }, []);

  if (dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Private browsing / storage disabled — dismiss still works for this
      // render, it just won't persist across reloads.
    }
  }

  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl bg-zinc-900 p-4 text-white sm:flex-row sm:items-center sm:justify-between dark:bg-zinc-950">
      <div className="flex items-start gap-3">
        <LightningIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <div>
          <p className="text-sm font-medium">&ldquo;องค์กรที่แข็งแกร่ง เริ่มจากคนที่พร้อม และเครื่องมือที่ใช้&rdquo;</p>
          <p className="text-xs text-zinc-400">ThunderOne — ทำให้การทำงานร่วมกันเป็นไปได้อย่างไม่จำกัด</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20"
        >
          เรียนรู้เพิ่มเติมเกี่ยวกับ ThunderOne
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="ปิด"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
