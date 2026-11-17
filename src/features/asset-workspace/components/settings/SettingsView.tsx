"use client";

// Settings (05 §4.12): four tabs, Save per tab. Switching away from a tab with unsaved input asks first (checklist §1.1).
import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/lovable/alert-dialog";
import type { AssetSettings } from "../../domain/asset-settings";
import type { MultiOption } from "../inventory/MultiSelect";
import { AssetTagTab } from "./AssetTagTab";
import { InventoryDefaultsTab } from "./InventoryDefaultsTab";
import { LabelsTab } from "./LabelsTab";
import { PreferencesTab } from "./PreferencesTab";

const TABS = [
  { key: "asset-id", label: "Asset ID & Tags" },
  { key: "labels", label: "Labels" },
  { key: "inventory", label: "Inventory Defaults" },
  { key: "preferences", label: "Workspace Preferences" },
] as const;
type TabKey = (typeof TABS)[number]["key"];
const isTab = (value: string | null): value is TabKey => TABS.some((tab) => tab.key === value);

export function SettingsView({
  initial,
  categories,
}: {
  initial: AssetSettings;
  categories: MultiOption[] | null;
}) {
  const params = useSearchParams();
  const requested = params.get("tab");
  const [tab, setTab] = useState<TabKey>(isTab(requested) ? requested : "asset-id");
  const [settings, setSettings] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [target, setTarget] = useState<TabKey | null>(null);

  // The tab is client state (the URL only mirrors it for reload and links), so a switch never re-runs the server read.
  const go = useCallback((next: TabKey) => {
    setDirty(false);
    setTab(next);
    window.history.replaceState(null, "", `?tab=${next}`);
  }, []);
  const onChange = (value: string) => {
    if (!isTab(value) || value === tab) return;
    if (dirty) setTarget(value);
    else go(value);
  };
  const common = { settings, onSaved: setSettings, onDirtyChange: setDirty };

  return (
    <div className="space-y-4 p-6">
      <PageHeader
        title="Settings"
        subtitle="Configure how Asset Workspace works for your organization."
      />
      <Tabs
        variant="underline"
        value={tab}
        onValueChange={onChange}
      >
        <TabsList
          aria-label="Settings sections"
          className="overflow-x-auto"
        >
          {TABS.map((item) => (
            <TabsTrigger
              key={item.key}
              value={item.key}
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent
          value="asset-id"
          className="pt-4"
        >
          <AssetTagTab {...common} />
        </TabsContent>
        <TabsContent
          value="labels"
          className="pt-4"
        >
          <LabelsTab {...common} />
        </TabsContent>
        <TabsContent
          value="inventory"
          className="pt-4"
        >
          <InventoryDefaultsTab
            {...common}
            categories={categories}
          />
        </TabsContent>
        <TabsContent
          value="preferences"
          className="pt-4"
        >
          <PreferencesTab />
        </TabsContent>
      </Tabs>
      <AlertDialog
        open={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>You have unsaved changes on this tab. They will be lost if you switch.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (target) go(target);
                setTarget(null);
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
