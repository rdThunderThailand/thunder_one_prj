"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/lovable/switch";
import { RegistrationField, RegistrationSelect, RegistrationTextField } from "../register-asset/RegistrationFields";
import { MultiSelect, type MultiOption } from "../inventory/MultiSelect";
import { dueDaysError, sameIds, type AssetSettings } from "../../domain/asset-settings";
import { useSettingsSave } from "../../hooks/use-settings-save";
import { InfoBanner, SettingsGroup, SettingsSection } from "./SettingsParts";

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
      <SettingsGroup
        id="settings-inventory-scope"
        title="Default scope"
        description="Select which assets and locations are included by default."
      >
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <div className="min-w-0 space-y-4">
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
            <RegistrationSelect
              name="settings-locations"
              label="Locations"
              required
              disabled
              value="required"
              onChange={() => {}}
              items={[{ value: "required", label: "Required" }]}
              hint="Fixed by design: pick at least one location in Start Inventory. This cannot be changed."
            />
            <RegistrationSelect
              name="settings-retired-disposed"
              label="Retired and disposed assets"
              disabled
              value="excluded"
              onChange={() => {}}
              items={[{ value: "excluded", label: "Excluded" }]}
              hint="Fixed by design: these are always left out of new sessions. This cannot be changed."
            />
          </div>
          <div className="self-start">
            <InfoBanner title="How this works">
              <ul className="list-disc space-y-1 pl-4">
                <li>These are starting defaults for new inventory sessions.</li>
                <li>You can change categories and locations in the Start Inventory flow.</li>
                <li>Retired and disposed assets are excluded by default.</li>
              </ul>
            </InfoBanner>
          </div>
        </div>
      </SettingsGroup>
      <SettingsGroup
        id="settings-inventory-schedule"
        title="Default schedule"
        description="Set the default timeline for inventory sessions."
      >
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <RegistrationTextField
            name="settings-due-days"
            label="Default due date (days after today)"
            required
            inputMode="numeric"
            value={days}
            error={local ?? fromCore}
            hint="Suggested due date for new inventory sessions. 1 to 365 days."
            autoComplete="off"
            className="h-10"
            onChange={(event) => setDays(event.target.value)}
            onBlur={() => setTouched(true)}
          />
        </div>
      </SettingsGroup>
      <SettingsGroup
        id="settings-inventory-verification"
        title="Default verification options"
        description="How assets are verified in every inventory session."
      >
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <div className="flex min-w-0 items-start gap-3">
            <Switch
              id="registration-settings-multi-user"
              checked
              disabled
              aria-describedby="registration-settings-multi-user-hint"
            />
            <div className="min-w-0 space-y-1">
              <label
                htmlFor="registration-settings-multi-user"
                className="block text-sm font-medium text-foreground"
              >
                Allow multi-user verification
              </label>
              <p
                id="registration-settings-multi-user-hint"
                className="text-xs text-muted-foreground"
              >
                Fixed by design: more than one user can verify in the same session. This cannot be changed.
              </p>
            </div>
          </div>
          <fieldset
            disabled
            className="min-w-0 space-y-1"
          >
            <legend className="mb-1 text-sm font-medium text-foreground">Result options</legend>
            {["Verified", "Mismatch", "Not Found", "Unexpected"].map((result) => (
              <label
                key={result}
                className="flex min-h-8 cursor-not-allowed items-center gap-2 text-sm text-foreground opacity-70"
              >
                <input
                  type="checkbox"
                  checked
                  readOnly
                  disabled
                  className="accent-primary"
                />
                <span>{result}</span>
              </label>
            ))}
            <p className="text-xs text-muted-foreground">Fixed by design: every finding uses these four results. This cannot be changed.</p>
          </fieldset>
        </div>
      </SettingsGroup>
    </SettingsSection>
  );
}
