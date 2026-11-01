import type { ComponentType, ReactNode, RefObject } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/lovable/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import type { AssetListQuery } from "../../services/assets-list-query";
import {
  AssignmentIcon, ChevronDownIcon, GridIcon, InventoryIcon, ListIcon,
  LocationIcon, MoreIcon, PlusIcon, ScanIcon, TransferIcon, XIcon,
} from "@/components/ui/icons";

interface UnavailableActionProps {
  children?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  label?: string;
  primary?: boolean;
  className?: string;
}

/** Aria-disabled keeps the explanation discoverable by keyboard users. No action is attached. */
export function UnavailableAction({ children, icon: Icon, label, primary, className }: UnavailableActionProps) {
  return (
    <Button
      aria-disabled="true"
      aria-label={label}
      aria-description="This action is not available in this version of the Assets page."
      title="Not available in this version of the Assets page"
      variant={primary ? "primary" : "outline"}
      size={label ? "icon-sm" : "sm"}
      className={`cursor-not-allowed opacity-50 ${label ? "" : "px-2"} ${className ?? ""}`}
    >
      {Icon && <Icon className="size-4" />}
      {children}
    </Button>
  );
}

export function AssetsPageActions({ onScan, scanTriggerRef }: { onScan: () => void; scanTriggerRef: RefObject<HTMLButtonElement | null> }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button ref={scanTriggerRef} variant="outline" size="sm" onClick={onScan}>
        <ScanIcon className="size-4" />
        Scan Asset
      </Button>
      <Button asChild variant="primary" size="sm">
        <Link href="/asset-workspace/assets/register">
          <PlusIcon className="size-4" />
          Register Asset
        </Link>
      </Button>
      <UnavailableAction>
        More Actions
        <ChevronDownIcon className="size-3" />
      </UnavailableAction>
    </div>
  );
}

export function AssetsSelectionToolbar({ count, clear }: { count: number; clear: () => void }) {
  return (
    <div role="toolbar" aria-label="Selected asset actions" className="flex w-max items-center gap-1">
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="mr-1 text-xs font-semibold text-foreground"
      >
        {count} selected
      </span>
      {count > 0 && (
        <Button variant="ghost" size="icon-sm" aria-label="Clear selection" onClick={clear}>
          <XIcon className="size-3" />
        </Button>
      )}
      <UnavailableAction icon={AssignmentIcon}>Assign</UnavailableAction>
      <UnavailableAction icon={TransferIcon}>Transfer</UnavailableAction>
      <UnavailableAction icon={LocationIcon}>Move Location</UnavailableAction>
      <UnavailableAction>
        Update Status
        <ChevronDownIcon className="size-3" />
      </UnavailableAction>
      <UnavailableAction icon={InventoryIcon}>Add to Inventory</UnavailableAction>
      <UnavailableAction label="More selected asset actions" icon={MoreIcon} />
    </div>
  );
}

export function AssetsViewControls() {
  return (
    <div className="flex items-center gap-1" aria-label="Assets view">
      <Button variant="secondary" size="icon-sm" aria-label="List view" aria-pressed="true">
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
      <SelectTrigger aria-label="Asset sort order" className="h-8 w-56 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="created_at">Newest registered</SelectItem>
        <SelectItem value="status_since">Longest in current status</SelectItem>
      </SelectContent>
    </Select>
  );
}
