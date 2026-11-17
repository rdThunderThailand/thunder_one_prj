"use client";

import { useEffect, useState } from "react";
import { RegistrationField, RegistrationTextField } from "../register-asset/RegistrationFields";
import { MultiSelect, type MultiOption } from "../inventory/MultiSelect";
import { dueDaysError, sameIds, type AssetSettings } from "../../domain/asset-settings";
import { useSettingsSave } from "../../hooks/use-settings-save";
import { InfoBanner, SettingsSection } from "./SettingsParts";

/** Inventory Defaults (05 §4.12.3): prefill for a new Draft only; the wizard can change both. 14 days / all are Proposed (D14). */
export function InventoryDefaultsTab({
  settings,
  categories,
  onSaved,
  onDirtyChange,
}: {
  settings: AssetSettings;
  /** `null` = the category list failed to load. */
  categories: MultiOption[] | null;
  onSaved: (next: AssetSettings) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [days, setDays] = useState(String(settings.inventoryDefaults.dueDays));
  const [categoryIds, setCategoryIds] = useState(settings.inventoryDefaults.categoryIds);
  const [touched, setTouched] = useState(false);
  const { save, reload, pending, error } = useSettingsSave(settings, onSaved);
  const local = touched ? dueDaysError(days) : null;
  const fromCore = error?.code === "VALIDATION" ? (error.fieldErrors?.inventoryDefaults ?? error.fieldErrors?.dueDays)?.[0] : undefined;
  const dirty = days.trim() !== String(settings.inventoryDefaults.dueDays) || !sameIds(categoryIds, settings.inventoryDefaults.categoryIds);

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  function submit() {
    setTouched(true);
    if (dueDaysError(days)) return;
    save({ inventoryDefaults: { dueDays: Number(days), categoryIds } });
  }

  return (
    <SettingsSection
      id="settings-inventory"
      title="Inventory defaults"
      description="Starting values for new inventory sessions."
      dirty={dirty}
      saving={pending}
      error={error && !fromCore ? error : null}
      onSave={submit}
      onReload={reload}
    >
      <InfoBanner>These apply to new Drafts only. You can change them in the Start Inventory flow, and a started session never changes.</InfoBanner>
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <RegistrationTextField
          name="settings-due-days"
          label="Default due date (days after today)"
          required
          inputMode="numeric"
          value={days}
          error={local ?? fromCore}
          hint="1 to 365 days."
          autoComplete="off"
          className="h-10"
          onChange={(event) => setDays(event.target.value)}
          onBlur={() => setTouched(true)}
        />
        <RegistrationField
          name="settings-categories"
          label="Default categories"
          hint="Leave empty to include all categories."
        >
          {categories ? (
            <MultiSelect
              id="registration-settings-categories"
              options={categories}
              value={categoryIds}
              onChange={setCategoryIds}
              placeholder="All categories"
            />
          ) : (
            <p
              role="status"
              className="text-xs text-error"
            >
              Categories could not be loaded. Reload the page to try again.
            </p>
          )}
        </RegistrationField>
      </div>
    </SettingsSection>
  );
}
