"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { deriveAspectRatio, parseResolution } from "../geometry";
import { LAYOUT_STATUSES, RESOLUTION_PRESETS, type LayoutStatus } from "../types";

const inputClasses =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

type Settings = {
  name: string;
  aspectRatio: string;
  referenceResolution: string | null;
  background: string;
  status: LayoutStatus;
};

/** Name / resolution (or, for a legacy Layout, aspect ratio) / background / status. No
 *  Publish button and no content picker anywhere in this step: that is the central decision
 *  of ADR 0044 §1 (docs/layouts/plan-layout-execution.md Task 7 Step 4). */
export function LayoutSettingsStep({
  name,
  aspectRatio,
  referenceResolution,
  background,
  status,
  onChange,
}: Settings & { onChange: (next: Settings) => void }) {
  // A legacy null-resolution Layout must reopen and save unchanged, with no forced
  // migration — this local override is the only way an operator opts one into a resolution.
  const [showLegacyResolutionInput, setShowLegacyResolutionInput] = useState(false);
  const initialResolution = referenceResolution ? parseResolution(referenceResolution) : null;
  // "Custom" is a UI mode, not a derived fact about the stored value — a mode-selected
  // dropdown that only switched based on whether the current value happened to match a
  // preset string never showed its own inputs when picked (bug found in browser verification).
  const [customMode, setCustomMode] = useState(
    referenceResolution !== null && !(RESOLUTION_PRESETS as readonly string[]).includes(referenceResolution)
  );
  const [customWidth, setCustomWidth] = useState(initialResolution ? String(initialResolution[0]) : "");
  const [customHeight, setCustomHeight] = useState(initialResolution ? String(initialResolution[1]) : "");

  const set = (patch: Partial<Settings>) =>
    onChange({ name, aspectRatio, referenceResolution, background, status, ...patch });

  const setResolution = (resolution: string) => {
    const parsed = parseResolution(resolution);
    if (!parsed) return;
    set({ referenceResolution: resolution, aspectRatio: deriveAspectRatio(parsed[0], parsed[1]) });
  };

  const customValid = parseResolution(`${customWidth}x${customHeight}`) !== null;

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted-foreground">Layout name</label>
        <input value={name} onChange={(e) => set({ name: e.target.value })} className={inputClasses} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {referenceResolution === null && !showLegacyResolutionInput ? (
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-sm font-medium text-muted-foreground">Aspect ratio</label>
            <input
              value={aspectRatio}
              placeholder="16:9"
              onChange={(e) => set({ aspectRatio: e.target.value })}
              className={inputClasses}
            />
            <button
              type="button"
              onClick={() => setShowLegacyResolutionInput(true)}
              className="self-start text-xs font-medium text-primary hover:underline"
            >
              Set a resolution
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-sm font-medium text-muted-foreground">Resolution</label>
            <select
              value={customMode ? "custom" : (referenceResolution ?? "")}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setCustomMode(true);
                  return;
                }
                setCustomMode(false);
                setResolution(e.target.value);
              }}
              className={inputClasses}
            >
              {referenceResolution === null && !customMode && <option value="">Choose a resolution…</option>}
              {RESOLUTION_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
            {customMode && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={1}
                  min={100}
                  max={99999}
                  placeholder="Width"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  onBlur={() => customValid && setResolution(`${customWidth}x${customHeight}`)}
                  className={inputClasses}
                />
                <span className="text-muted-foreground">×</span>
                <input
                  type="number"
                  step={1}
                  min={100}
                  max={99999}
                  placeholder="Height"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  onBlur={() => customValid && setResolution(`${customWidth}x${customHeight}`)}
                  className={inputClasses}
                />
              </div>
            )}
            {customMode && !customValid && (customWidth || customHeight) && (
              <p className="text-xs text-danger">
                Width and height must each be 100–99999.
              </p>
            )}
            <p className="text-xs text-muted-foreground">Aspect ratio: {aspectRatio}</p>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">Background</label>
          <input
            type="color"
            value={background}
            onChange={(e) => set({ background: e.target.value })}
            className="h-[42px] w-full rounded-lg border border-border bg-card p-1"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">Status</label>
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
