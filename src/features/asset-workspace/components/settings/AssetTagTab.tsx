"use client";

import { useEffect, useState } from "react";
import { RegistrationTextField } from "../register-asset/RegistrationFields";
import { prefixError, previewNextTag, type AssetSettings } from "../../domain/asset-settings";
import { useSettingsSave } from "../../hooks/use-settings-save";
import { InfoBanner, SettingsSection } from "./SettingsParts";

/** Asset ID & Tags (05 §4.12.1): only the prefix is editable. Mode is Both (D13) and the counter is never client-editable. */
export function AssetTagTab({
  settings,
  onSaved,
  onDirtyChange,
}: {
  settings: AssetSettings;
  onSaved: (next: AssetSettings) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [prefix, setPrefix] = useState(settings.assetTag.prefix);
  const [touched, setTouched] = useState(false);
  const { save, reload, pending, error } = useSettingsSave(settings, onSaved);
  const local = touched ? prefixError(prefix) : null;
  const fromCore = error?.code === "VALIDATION" ? error.fieldErrors?.prefix?.[0] : error?.code === "TAG_TAKEN" ? error.message : undefined;
  const dirty = prefix.trim().toUpperCase() !== settings.assetTag.prefix;
  const preview = previewNextTag(settings.assetTag.nextTag, prefix);

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  function submit() {
    setTouched(true);
    if (prefixError(prefix)) return;
    save({ assetTag: { prefix: prefix.trim().toUpperCase() } });
  }

  return (
    <SettingsSection
      id="settings-asset-tag"
      title="Asset ID format"
      description="How new Asset Tags are generated for your organization."
      dirty={dirty}
      saving={pending}
      error={error && !fromCore ? error : null}
      onSave={submit}
      onReload={reload}
    >
      <InfoBanner>Changes apply to new assets only. Existing Asset IDs and tags are not changed, and the running number never resets.</InfoBanner>
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <RegistrationTextField
          name="settings-prefix"
          label="Prefix"
          required
          value={prefix}
          error={local ?? fromCore}
          hint="2–8 characters, A–Z and 0–9. Saved in uppercase."
          placeholder="AST"
          autoComplete="off"
          spellCheck={false}
          maxLength={8}
          className="h-10 uppercase"
          onChange={(event) => setPrefix(event.target.value)}
          onBlur={() => setTouched(true)}
        />
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium text-foreground">Next generated ID</p>
          <p
            aria-live="polite"
            className="flex h-10 items-center rounded-lg border border-border bg-muted px-3 text-sm font-semibold text-foreground"
          >
            {preview ?? "All numbers are used"}
          </p>
          <p className="text-xs text-muted-foreground">
            {preview ? "The 6-digit number continues from the last tag." : "No more tags can be generated. Contact support."}
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Mode: auto-generated, and a tag can still be typed by hand when registering an asset.</p>
    </SettingsSection>
  );
}
