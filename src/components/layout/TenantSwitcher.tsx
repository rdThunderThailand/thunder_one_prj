"use client";

import { useState } from "react";
import { BuildingIcon, CheckIcon, ChevronDownIcon, SearchIcon } from "@/components/ui/icons";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import type { AvailableTenant } from "@/features/auth/services/get-session";

interface TenantSwitcherProps {
  tenantId: string | null;
  tenantName: string | null;
  tenants: AvailableTenant[];
  collapsed: boolean;
}

// The Sidebar's tenant row. A static label for someone with one tenant; a
// button that opens a modal of tenant cards (image + name) for someone who can
// enter more (a platform super admin sees every tenant Thunder One serves).
// Picking one sets the tenant cookie via /api/auth/tenant, then reloads from
// "/" so every page, the role, and the owner/viewer workspace visibility
// (config/tenant-access.ts) are resolved again for the new tenant.
export function TenantSwitcher({ tenantId, tenantName, tenants, collapsed }: TenantSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const label = tenantName ?? "Thunder One";
  const canSwitch = tenants.length > 1;
  const needle = query.trim().toLocaleLowerCase();
  const visibleTenants = needle ? tenants.filter((tenant) => tenant.name.toLocaleLowerCase().includes(needle)) : tenants;

  async function switchTenant(id: string) {
    if (id === tenantId) {
      setIsOpen(false);
      return;
    }
    setSwitchingTo(id);
    setError(null);
    const res = await fetch("/api/auth/tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: id }),
    }).catch(() => null);
    if (!res?.ok) {
      setSwitchingTo(null);
      setError("สลับองค์กรไม่สำเร็จ");
      return;
    }
    window.location.assign("/");
  }

  const rowClasses = `mb-2 flex h-9 w-full items-center gap-2.5 rounded-lg border border-border px-3 text-xs font-semibold text-foreground ${
    collapsed ? "justify-center" : ""
  }`;

  if (!canSwitch) {
    return (
      <div
        className={rowClasses}
        title={collapsed ? label : undefined}
      >
        <BuildingIcon className="h-4 w-4 shrink-0 text-t1-gray-400" />
        {!collapsed && <span className="flex-1 truncate">{label}</span>}
      </div>
    );
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        // Stay open while a switch is in flight — the page is about to reload.
        if (switchingTo !== null) return;
        setIsOpen(open);
        // Each open starts from the full list.
        if (!open) setQuery("");
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          title={collapsed ? label : undefined}
          className={`${rowClasses} text-left transition-colors hover:bg-t1-gray-50`}
        >
          <BuildingIcon className="h-4 w-4 shrink-0 text-t1-gray-400" />
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{label}</span>
              <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-t1-gray-400" />
            </>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] max-w-3xl grid-rows-[auto_minmax(0,1fr)]">
        <DialogHeader>
          <DialogTitle>สลับองค์กร</DialogTitle>
          <DialogDescription>เลือกองค์กรที่ต้องการเข้าใช้งาน</DialogDescription>
          <div className="relative pt-2">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาองค์กร"
              aria-label="ค้นหาองค์กร"
              className="pl-9"
            />
          </div>
        </DialogHeader>

        <div className="-mx-1 overflow-y-auto px-1 pb-1">
          {visibleTenants.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">ไม่พบองค์กรที่ตรงกับ “{query.trim()}”</p>
          )}
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visibleTenants.map((tenant) => (
              <li key={tenant.id}>
                <TenantCard
                  tenant={tenant}
                  current={tenant.id === tenantId}
                  switching={switchingTo === tenant.id}
                  disabled={switchingTo !== null}
                  onSelect={() => switchTenant(tenant.id)}
                />
              </li>
            ))}
          </ul>
          {error && (
            <p
              role="alert"
              className="mt-3 text-xs text-error"
            >
              {error}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TenantCardProps {
  tenant: AvailableTenant;
  current: boolean;
  switching: boolean;
  disabled: boolean;
  onSelect: () => void;
}

// Two parts: the tenant's image on top, its name below. The image falls back
// to the tenant's initials when Core sends no logo_url or the URL fails to load.
function TenantCard({ tenant, current, switching, disabled, onSelect }: TenantCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = tenant.logoUrl !== null && !imageFailed;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={current}
      className={`group flex w-full cursor-pointer flex-col overflow-hidden rounded-lg border bg-card text-left transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-60 ${
        current ? "border-primary ring-1 ring-primary" : "border-border"
      }`}
    >
      <div className="relative flex aspect-video w-full items-center justify-center bg-muted">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- logo host is whatever Core stores, not a known next/image remote
          <img
            src={tenant.logoUrl!}
            alt=""
            className="h-full w-full object-contain p-4"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span
            aria-hidden="true"
            className="text-2xl font-bold text-muted-foreground"
          >
            {initials(tenant.name)}
          </span>
        )}
        {current && (
          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
            <CheckIcon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="flex min-h-11 items-center gap-2 border-t border-border px-3 py-2">
        <span className="flex-1 truncate text-sm font-semibold text-foreground">{tenant.name}</span>
        {switching && <span className="shrink-0 text-xs text-muted-foreground">กำลังสลับ...</span>}
      </div>
    </button>
  );
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return words
    .slice(0, 2)
    .map((word) => Array.from(word)[0])
    .join("")
    .toUpperCase();
}
