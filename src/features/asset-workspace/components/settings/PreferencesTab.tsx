"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/lovable/switch";
import { RegistrationSelect } from "../register-asset/RegistrationFields";
import {
  FIRST_DAY_NAMES,
  FIRST_DAYS,
  PAGE_SIZES,
  PREFERENCE_MENU_NAMES,
  PREFERENCE_MENUS,
  PREFERENCE_SORT_NAMES,
  PREFERENCE_SORTS,
  PREFERENCE_VIEWS,
  type AssetSettings,
  type FirstDay,
  type PreferenceMenu,
  type PreferenceSort,
  type PreferenceView,
  type WorkspacePreferences,
} from "../../domain/asset-settings";
import { useSettingsSave } from "../../hooks/use-settings-save";
import { InfoBanner, SettingsGroup, SettingsSection } from "./SettingsParts";

const VIEW_ITEMS = PREFERENCE_VIEWS.map((view) => ({ value: view, label: view === "table" ? "Table view" : "List view" }));
const SIZE_ITEMS = PAGE_SIZES.map((size) => ({ value: String(size), label: `${size} items per page` }));
const SORT_ITEMS = PREFERENCE_SORTS.map((sort) => ({ value: sort, label: PREFERENCE_SORT_NAMES[sort] }));
const DAY_ITEMS = FIRST_DAYS.map((day) => ({ value: day, label: FIRST_DAY_NAMES[day] }));

const same = (a: WorkspacePreferences, b: WorkspacePreferences) =>
  a.pageSize === b.pageSize &&
  a.sort === b.sort &&
  a.rememberFilters === b.rememberFilters &&
  a.firstDayOfWeek === b.firstDayOfWeek &&
  PREFERENCE_MENUS.every((menu) => a.views[menu] === b.views[menu]);

/**
 * Workspace Preferences (05 §4.12.4): org defaults an Asset Admin sets for the list screens. Owner decision on D15; the PO has
 * not confirmed it. Default columns, time format, date format, default filters and the map options are not here (still open).
 */
export function PreferencesTab({
  settings,
  onSaved,
  onDirtyChange,
}: {
  settings: AssetSettings;
  onSaved: (next: AssetSettings) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [draft, setDraft] = useState(settings.preferences);
  const { save, reload, pending, error } = useSettingsSave(settings, onSaved);
  const dirty = !same(draft, settings.preferences);

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  const setView = (menu: PreferenceMenu, view: string) => setDraft((current) => ({ ...current, views: { ...current.views, [menu]: view as PreferenceView } }));

  return (
    <SettingsSection
      id="settings-preferences"
      title="Workspace preferences"
      description="Default display and list preferences for everyone in your organization."
      dirty={dirty}
      saving={pending}
      error={error}
      onSave={() => save({ preferences: draft })}
      onReload={reload}
    >
      <InfoBanner title="How this works">
        <ul className="list-disc space-y-1 pl-4">
          <li>These are organization defaults. An Asset Admin sets them for everyone.</li>
          <li>Screens use them when they open. They do not change what people have already filtered.</li>
        </ul>
      </InfoBanner>
      <SettingsGroup
        id="settings-preferences-views"
        title="Default views"
        description="Choose the default view when opening each main menu."
      >
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          {PREFERENCE_MENUS.map((menu) => (
            <RegistrationSelect
              key={menu}
              name={`settings-view-${menu}`}
              label={PREFERENCE_MENU_NAMES[menu]}
              value={draft.views[menu]}
              onChange={(value) => setView(menu, value)}
              items={VIEW_ITEMS}
            />
          ))}
        </div>
      </SettingsGroup>
      <SettingsGroup
        id="settings-preferences-list"
        title="List display"
        description="How information is shown in asset lists."
      >
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <RegistrationSelect
            name="settings-page-size"
            label="Default page size"
            value={String(draft.pageSize)}
            onChange={(value) => setDraft((current) => ({ ...current, pageSize: Number(value) as WorkspacePreferences["pageSize"] }))}
            items={SIZE_ITEMS}
          />
          <RegistrationSelect
            name="settings-sort"
            label="Default sort"
            value={draft.sort}
            onChange={(value) => setDraft((current) => ({ ...current, sort: value as PreferenceSort }))}
            items={SORT_ITEMS}
            hint="Only the sorts the asset list supports today."
          />
        </div>
      </SettingsGroup>
      <SettingsGroup
        id="settings-preferences-other"
        title="Other preferences"
        description="Behavior and calendar defaults."
      >
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <div className="flex min-w-0 items-start gap-3">
            <Switch
              id="registration-settings-remember-filters"
              checked={draft.rememberFilters}
              onCheckedChange={(checked) => setDraft((current) => ({ ...current, rememberFilters: checked }))}
              aria-describedby="registration-settings-remember-filters-hint"
            />
            <div className="min-w-0 space-y-1">
              <label
                htmlFor="registration-settings-remember-filters"
                className="block text-sm font-medium text-foreground"
              >
                Remember last filters
              </label>
              <p
                id="registration-settings-remember-filters-hint"
                className="text-xs text-muted-foreground"
              >
                Keep filters when returning to each menu.
              </p>
            </div>
          </div>
          <RegistrationSelect
            name="settings-first-day"
            label="First day of week"
            value={draft.firstDayOfWeek}
            onChange={(value) => setDraft((current) => ({ ...current, firstDayOfWeek: value as FirstDay }))}
            items={DAY_ITEMS}
          />
        </div>
      </SettingsGroup>
    </SettingsSection>
  );
}
