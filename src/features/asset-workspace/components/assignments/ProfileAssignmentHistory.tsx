"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ClockIcon, FileTextIcon, ListIcon, LocationIcon, ShieldIcon, ToolIcon, UserIcon } from "@/components/ui/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/lovable/tabs";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { DisabledHint } from "../asset-profile/ProfileControls";
import { EmptyState } from "../states/states";
import { ProfileAllHistory } from "../asset-profile/ProfileAllHistory";
import { ProfileStatusHistory } from "../asset-profile/ProfileStatusHistory";
import { ProfileAssignmentEvents } from "./ProfileAssignmentEvents";
import { ProfileLocationHistory } from "./ProfileLocationHistory";

export const profileHistoryTabs = [
  { id: "all", label: "All History", icon: ListIcon, disabled: false },
  { id: "assignment", label: "Assignment History", icon: UserIcon, disabled: false },
  { id: "location", label: "Location History", icon: LocationIcon, disabled: false },
  { id: "status", label: "Status History", icon: ClockIcon, disabled: false },
  { id: "maintenance", label: "Maintenance History", icon: ToolIcon, disabled: false },
  { id: "file", label: "File History", icon: FileTextIcon, disabled: false },
  { id: "audit", label: "Audit Log", icon: ShieldIcon, disabled: false },
] as const;

// Frames 12–14 wait for the Lifecycle & Warranty module (profile-tabs FE 05).
const laterTabs = profileHistoryTabs.filter(({ id }) => id === "maintenance" || id === "file" || id === "audit");

export function ProfileHistoryLayout({ children, panel }: { children: ReactNode; panel?: ReactNode }) {
  const grid = useRef<HTMLDivElement>(null);
  const aside = useRef<HTMLDivElement>(null);
  const hasPanel = Boolean(panel);
  useLayoutEffect(() => {
    const row = grid.current;
    const panelRegion = aside.current;
    const main = row?.closest("main");
    if (!row || !panelRegion || !main) return;

    // The panel shares main's scroll position. Only its own overflowing content needs a second scroller.
    function measure() {
      if (!row || !panelRegion || !main) return;
      const mainRect = main.getBoundingClientRect();
      const inset = Number.parseFloat(getComputedStyle(panelRegion).top) || 0;
      const padding = Number.parseFloat(getComputedStyle(main).paddingBottom) || 0;
      const visibleTop = mainRect.top + main.clientTop;
      const available = visibleTop + main.clientHeight - padding - Math.max(visibleTop + inset, row.getBoundingClientRect().top);
      if (available > 0) panelRegion.style.setProperty("--profile-panel-height", `${Math.floor(available)}px`);
      else panelRegion.style.removeProperty("--profile-panel-height");
    }

    const observer = new ResizeObserver(measure);
    observer.observe(main);
    observer.observe(row);
    main.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      main.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [hasPanel]);

  return (
    <div className="@container/profile-history min-w-0">
      <div ref={grid} className={`grid min-w-0 items-start gap-3 ${hasPanel ? "@3xl/profile-history:grid-cols-[minmax(0,3fr)_minmax(var(--container-sm),2fr)]" : ""}`}>
        <div className="min-w-0 space-y-3">{children}</div>
        {hasPanel && (
          <div ref={aside} className="min-w-0 @3xl/profile-history:sticky @3xl/profile-history:top-0 @3xl/profile-history:[&>*]:max-h-(--profile-panel-height) @3xl/profile-history:[&>*]:overflow-y-auto">
            {panel}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProfileAssignmentHistory({ context, asset, initialTab }: { context: string; asset: AssetDetail; initialTab?: string | null }) {
  // `?history=status` (Change Status result link) opens that sub-tab.
  const [tab, setTab] = useState(profileHistoryTabs.some(({ id, disabled }) => id === initialTab && !disabled) ? initialTab as string : "all");
  const nav = (
    <TabsList aria-label="Asset history sections" className="flex h-auto min-h-10 w-full flex-wrap justify-start gap-0 rounded-control border border-border bg-card p-1">
      {profileHistoryTabs.map(({ id, label, icon: Icon, disabled }) => {
        const trigger = (
          <TabsTrigger value={id} disabled={disabled}
            className="min-h-9 shrink-0 gap-1.5 rounded-none border-b-2 border-transparent px-1.5 text-xs data-[state=active]:border-primary data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-none motion-reduce:transition-none">
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </TabsTrigger>
        );
        return disabled ? <DisabledHint key={id}>{trigger}</DisabledHint> : <span key={id}>{trigger}</span>;
      })}
    </TabsList>
  );
  return (
    <Tabs value={tab} onValueChange={setTab} className="min-w-0 space-y-3">
      {nav}
      <ProfileAssignmentEvents context={context} asset={asset} enabled={tab === "assignment"} layout={(assignment, assignmentPanel) => (
        <ProfileLocationHistory context={context} assetId={asset.id} enabled={tab === "location"} layout={(location, locationPanel) => (
          <ProfileStatusHistory context={context} assetId={asset.id} enabled={tab === "status"} layout={(status, statusPanel) => (
            <ProfileHistoryLayout panel={tab === "location" ? locationPanel : tab === "status" ? statusPanel : assignmentPanel}>
              <TabsContent value="all" className="m-0">
                <ProfileAllHistory context={context} assetId={asset.id} />
              </TabsContent>
              <TabsContent value="assignment" className="m-0 min-w-0">
                {assignment}
              </TabsContent>
              <TabsContent value="location" className="m-0 min-w-0">
                {location}
              </TabsContent>
              <TabsContent value="status" className="m-0 min-w-0">
                {status}
              </TabsContent>
              {laterTabs.map(({ id, label }) => (
                <TabsContent key={id} value={id} className="m-0 min-w-0">
                  <EmptyState title={label} body="This view will be available after Lifecycle & Warranty is finished." />
                </TabsContent>
              ))}
            </ProfileHistoryLayout>
          )} />
        )} />
      )} />
    </Tabs>
  );
}
