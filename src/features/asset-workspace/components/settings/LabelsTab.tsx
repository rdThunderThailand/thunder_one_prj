"use client";

import { useEffect, useState } from "react";
import { LABEL_IDENTIFIERS, LABEL_IDENTIFIER_COPY, type AssetSettings, type LabelIdentifier } from "../../domain/asset-settings";
import { useSettingsSave } from "../../hooks/use-settings-save";
import { InfoBanner, SettingsSection } from "./SettingsParts";

/** Labels (05 §4.12.2): only the default identifier is saved. Size, format and fields are fixed by the PO (D04 / R2, AC-031). */
export function LabelsTab({
  settings,
  onSaved,
  onDirtyChange,
}: {
  settings: AssetSettings;
  onSaved: (next: AssetSettings) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [identifier, setIdentifier] = useState<LabelIdentifier>(settings.labels.identifier);
  const { save, reload, pending, error } = useSettingsSave(settings, onSaved);
  const dirty = identifier !== settings.labels.identifier;

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  return (
    <SettingsSection
      id="settings-labels"
      title="Labels"
      description="Defaults for printing asset labels."
      dirty={dirty}
      saving={pending}
      error={error}
      onSave={() => save({ labels: { identifier } })}
      onReload={reload}
    >
      <InfoBanner>Saving only changes the default in the label dialog. It never prints a label.</InfoBanner>
      <fieldset
        disabled={pending}
        className="min-w-0 space-y-2"
      >
        <legend className="text-xs font-medium text-foreground">Identifier on label</legend>
        <div className="grid gap-2 md:grid-cols-3">
          {LABEL_IDENTIFIERS.map((value) => (
            <label
              key={value}
              className="flex min-h-16 cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3 has-[:checked]:border-primary has-[:checked]:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
            >
              <input
                type="radio"
                name="label-identifier"
                value={value}
                checked={identifier === value}
                onChange={() => setIdentifier(value)}
                className="mt-1 accent-primary"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{LABEL_IDENTIFIER_COPY[value].title}</span>
                <span className="block text-xs text-muted-foreground">{LABEL_IDENTIFIER_COPY[value].body}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <dl className="grid gap-3 text-xs sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Size</dt>
          <dd className="font-medium text-foreground">50 × 30 mm</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Output</dt>
          <dd className="font-medium text-foreground">PDF</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Fields</dt>
          <dd className="font-medium text-foreground">Identifier, Asset Tag, Asset Name</dd>
        </div>
      </dl>
    </SettingsSection>
  );
}
