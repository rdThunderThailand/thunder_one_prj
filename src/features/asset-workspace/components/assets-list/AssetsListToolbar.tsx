import type { ComponentType, ReactNode, RefObject } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/lovable/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/lovable/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import type { AssetListQuery } from "../../services/assets-list-query";
import {
  AssignmentIcon, ChevronDownIcon, GridIcon, InventoryIcon, ListIcon,
  LocationIcon, PlusIcon, ScanIcon, TransferIcon, XIcon,
} from "@/components/ui/icons";
import { AssetsMoreActionsMenu, AssetsSelectedExportMenu } from "./AssetsExportMenus";

interface UnavailableActionProps {
  children?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  label?: string;
  className?: string;
}

const UNAVAILABLE_REASON = "Not available in this version of the Assets page";

/** Aria-disabled keeps the explanation discoverable by keyboard users. No action is attached.
 *  Muted text instead of opacity, so it reads as "not yet" rather than broken. */
export function UnavailableAction({ children, icon: Icon, label, className }: UnavailableActionProps) {
  return (
    <Button
      aria-disabled="true"
      aria-label={label}
      aria-description={`${UNAVAILABLE_REASON}.`}
      title={UNAVAILABLE_REASON}
      variant="outline"
      size={label ? "icon-sm" : "sm"}
      className={`cursor-not-allowed text-muted-foreground hover:bg-card ${label ? "max-sm:size-10" : "px-2 max-sm:h-10"} ${className ?? ""}`}
    >
      {Icon && <Icon className="size-4" />}
      {children}
    </Button>
  );
}

export function AssetsPageActions({ context, onScan, scanTriggerRef, onExport, exportDisabled, onLabels, labelsDisabled }: {
  context: string;
  onScan: () => void;
  scanTriggerRef: RefObject<HTMLButtonElement | null>;
  onExport: (trigger: HTMLButtonElement | null) => void;
  exportDisabled: boolean;
  onLabels: (trigger: HTMLButtonElement | null) => boolean;
  labelsDisabled: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button ref={scanTriggerRef} variant="outline" size="sm" className="max-sm:h-10" onClick={onScan}>
        <ScanIcon aria-hidden="true" className="size-4" />
        Scan Asset
      </Button>
      <RegisterAssetSplitButton />
      <AssetsMoreActionsMenu context={context} onExport={onExport} disabled={exportDisabled} onLabels={onLabels} labelsDisabled={labelsDisabled} />
    </div>
  );
}

/** PO split button: the main part opens the method choice, the chevron offers the methods directly. */
function RegisterAssetSplitButton() {
  return (
    <div className="flex items-center">
      <Button asChild variant="primary" size="sm" className="rounded-r-none max-sm:h-10">
        <Link href="/asset-workspace/assets/register">
          <PlusIcon className="size-4" />
          Register Asset
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="primary"
            size="icon-sm"
            aria-label="Choose registration method"
            className="rounded-l-none border-l border-primary-foreground/30 max-sm:size-10"
          >
            <ChevronDownIcon className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-2rem)]">
          <DropdownMenuItem asChild>
            <Link href="/asset-workspace/assets/register?mode=single">
              <AssetMenuItemText title="Single Asset" description="Register one asset step by step" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/asset-workspace/assets/import">
              <AssetMenuItemText title="Bulk Assets" description="Register multiple assets using file import or template" />
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function AssetMenuItemText({ title, description }: { title: string; description: string }) {
  return (
    <span className="flex flex-col">
      <span className="text-xs font-medium">{title}</span>
      <span className="text-xs leading-relaxed text-muted-foreground">{description}</span>
    </span>
  );
}

/** Bulk actions appear only once rows are selected; until then a hint explains what selection enables. */
export function AssetsSelectionToolbar({ count, clear, onExport, exportDisabled, onLabels }: {
  count: number; clear: () => void;
  onExport: (trigger: HTMLButtonElement | null) => void;
  exportDisabled: boolean;
  onLabels: (trigger: HTMLButtonElement | null) => boolean;
}) {
  return (
    <div role="toolbar" aria-label="Selected asset actions" className="flex min-h-8 min-w-0 flex-wrap items-center gap-2">
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={count > 0 ? "mr-1 text-xs font-semibold text-foreground" : "text-xs text-muted-foreground"}
      >
        {count > 0 ? `${count} selected` : "Select assets for bulk actions"}
      </span>
      {count > 0 && (
        <>
          <Button variant="ghost" size="icon-sm" className="max-sm:size-10" aria-label="Clear selection" onClick={clear}>
            <XIcon className="size-3" />
          </Button>
          <UnavailableAction icon={AssignmentIcon}>Assign</UnavailableAction>
          <UnavailableAction icon={TransferIcon}>Transfer</UnavailableAction>
          <UnavailableAction icon={LocationIcon}>Move Location</UnavailableAction>
          <UnavailableAction>
            Update Status
            <ChevronDownIcon className="size-3" />
          </UnavailableAction>
          <UnavailableAction icon={InventoryIcon}>Add to Inventory</UnavailableAction>
          <AssetsSelectedExportMenu onExport={onExport} disabled={exportDisabled} onLabels={onLabels} labelsDisabled={exportDisabled} />
        </>
      )}
    </div>
  );
}

export function AssetsViewControls() {
  return (
    <div className="flex items-center gap-1" aria-label="Assets view">
      <Button variant="secondary" size="icon-sm" className="bg-accent text-accent-foreground max-sm:size-10" aria-label="List view" aria-pressed="true">
        <ListIcon className="size-4" />
      </Button>
      <UnavailableAction label="Grid view" icon={GridIcon} />
    </div>
  );
}

export function AssetsSortControl({ value, pending, onChange }: {
  value: AssetListQuery["sort"]; pending: boolean; onChange: (value: AssetListQuery["sort"]) => void;
}) {
  return (
    <Select value={value} disabled={pending} onValueChange={(next) => {
      if (next === "created_at" || next === "status_since") onChange(next);
    }}>
      <SelectTrigger aria-label="Asset sort order" className="h-8 w-48 max-w-full text-xs max-sm:h-10">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="created_at">Newest registered</SelectItem>
        <SelectItem value="status_since">Longest in current status</SelectItem>
      </SelectContent>
    </Select>
  );
}
