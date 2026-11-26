"use client";

// Save of one Settings tab: the version it sends is the one the page loaded (STALE guard, 05 §4.12.5). A refusal keeps
// the typed values; the tab shows `error` and, for STALE, offers a reload that swaps the baseline but not the input.
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { AssetSettings, SettingsChange } from "../domain/asset-settings";
import { reloadSettingsAction, saveSettingsAction, type SettingsSaveResult } from "../services/asset-settings-actions";

export type SettingsSaveError = Extract<SettingsSaveResult, { ok: false }>;

export function useSettingsSave(settings: AssetSettings, onSaved: (next: AssetSettings) => void) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<SettingsSaveError | null>(null);

  function save(change: SettingsChange) {
    startTransition(async () => {
      const result = await saveSettingsAction(settings.updatedAt, change);
      if (result.ok) {
        setError(null);
        onSaved(result.data);
        toast.success("Settings saved");
      } else {
        setError(result);
      }
    });
  }

  /** After STALE: take the latest version as the baseline; what the user typed stays. */
  function reload() {
    startTransition(async () => {
      const result = await reloadSettingsAction();
      if (result.ok) {
        onSaved(result.data);
        setError(null);
      } else {
        setError({ ok: false, code: "FAILED", message: "Settings could not be reloaded. Try again." });
      }
    });
  }

  return { save, reload, pending, error, clearError: () => setError(null) };
}
