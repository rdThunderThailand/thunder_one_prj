"use client";

import { Card } from "@/components/ui/Card";
import { LAYOUT_STATUSES, type LayoutStatus } from "../types";

const inputClasses =
  "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

/** Exactly four fields — name / aspect ratio / background / status. No Publish button
 *  and no content picker anywhere in this step: that is the central decision of
 *  ADR 0044 §1 (docs/layouts/plan-layout-execution.md Task 7 Step 4). */
export function LayoutSettingsStep({
  name,
  aspectRatio,
  background,
  status,
  onChange,
}: {
  name: string;
  aspectRatio: string;
  background: string;
  status: LayoutStatus;
  onChange: (next: { name: string; aspectRatio: string; background: string; status: LayoutStatus }) => void;
}) {
  const set = (patch: Partial<{ name: string; aspectRatio: string; background: string; status: LayoutStatus }>) =>
    onChange({ name, aspectRatio, background, status, ...patch });

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Layout name</label>
        <input value={name} onChange={(e) => set({ name: e.target.value })} className={inputClasses} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Aspect ratio</label>
          <input
            value={aspectRatio}
            placeholder="16:9"
            onChange={(e) => set({ aspectRatio: e.target.value })}
            className={inputClasses}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Background</label>
          <input
            type="color"
            value={background}
            onChange={(e) => set({ background: e.target.value })}
            className="h-[42px] w-full rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</label>
          <select
            value={status}
            onChange={(e) => set({ status: e.target.value as LayoutStatus })}
            className={inputClasses}
          >
            {LAYOUT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "active" ? "Active" : "Inactive"}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );
}
