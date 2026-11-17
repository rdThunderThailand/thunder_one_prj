"use client";

import { useEffect, useState } from "react";
import {
  LABEL_FIELD_KEYS,
  LABEL_FIELD_NAMES,
  LABEL_IDENTIFIERS,
  LABEL_IDENTIFIER_COPY,
  type AssetSettings,
  type LabelFieldSettings,
  type LabelIdentifier,
} from "../../domain/asset-settings";
import { useSettingsSave } from "../../hooks/use-settings-save";
import { LabelPreview } from "./LabelPreview";
import { InfoBanner, SettingsSection } from "./SettingsParts";

/**
 * Labels (05 §4.12.2): the default identifier and which optional fields show (Figma "Show on Asset Tag"; Serial, Category,
 * Location and the logo are Proposed or absent in 05 and wait for the PO, D18). Size and format are fixed by the PO (D04 / R2).
 */
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
  const [fields, setFields] = useState<LabelFieldSettings>(settings.labels.fields);
  const { save, reload, pending, error } = useSettingsSave(settings, onSaved);
  const dirty = identifier !== settings.labels.identifier || LABEL_FIELD_KEYS.some((key) => fields[key] !== settings.labels.fields[key]);

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  return (
    <SettingsSection
      id="settings-labels"
      title="Labels"
      description="Defaults for printing asset labels."
      dirty={dirty}
      saving={pending}
      error={error}
      onSave={() => save({ labels: { identifier, fields } })}
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
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <fieldset
          disabled={pending}
          className="min-w-0 space-y-2"
        >
          <legend className="text-xs font-medium text-foreground">Show on label</legend>
          <label className="flex min-h-8 items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked
              disabled
              className="accent-primary"
            />
            <span>
              Asset Tag <span className="text-muted-foreground">(Required)</span>
            </span>
          </label>
          {LABEL_FIELD_KEYS.map((key) => (
            <label
              key={key}
              className="flex min-h-8 cursor-pointer items-center gap-2 text-sm text-foreground"
            >
              <input
                type="checkbox"
                checked={fields[key]}
                onChange={(event) => setFields((current) => ({ ...current, [key]: event.target.checked }))}
                className="accent-primary"
              />
              <span>{LABEL_FIELD_NAMES[key]}</span>
            </label>
          ))}
          <p className="text-xs text-muted-foreground">
            Serial Number, Category and Location are saved as your default. The label PDF draws the Asset Tag, Asset Name and Serial Number
            today; Category, Location and the logo follow once label data includes them.
          </p>
        </fieldset>
        <LabelPreview
          identifier={identifier}
          fields={fields}
          tag={settings.assetTag.nextTag ?? `${settings.assetTag.prefix}-000001`}
        />
      </div>
      <dl className="grid gap-3 text-xs sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Size</dt>
          <dd className="font-medium text-foreground">50 × 30 mm</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Output</dt>
          <dd className="font-medium text-foreground">PDF</dd>
        </div>
      </dl>
    </SettingsSection>
  );
}
