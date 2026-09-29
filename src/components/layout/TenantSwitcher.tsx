"use client";

import { useState } from "react";
import { BuildingIcon, CheckIcon, ChevronDownIcon } from "@/components/ui/icons";
import type { AvailableTenant } from "@/features/auth/services/get-session";

interface TenantSwitcherProps {
  tenantId: string | null;
  tenantName: string | null;
  tenants: AvailableTenant[];
  collapsed: boolean;
}

// The Sidebar's tenant row. A static label for someone with one tenant; a
// menu for someone who can enter more (a platform super admin sees every
// tenant Thunder One serves). Picking one sets the tenant cookie via
// /api/auth/tenant, then reloads from "/" so every page, the role, and the
// owner/viewer workspace visibility (config/tenant-access.ts) are resolved
// again for the new tenant.
export function TenantSwitcher({ tenantId, tenantName, tenants, collapsed }: TenantSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const label = tenantName ?? "Thunder One";
  const canSwitch = tenants.length > 1;

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

  const rowClasses = `mb-2 flex h-9 w-full items-center gap-2.5 rounded-lg border border-[#e6edf9] px-3 text-xs font-semibold text-[#071858] dark:border-zinc-800 dark:text-zinc-200 ${
    collapsed ? "justify-center" : ""
  }`;

  if (!canSwitch) {
    return (
      <div
        className={rowClasses}
        title={collapsed ? label : undefined}
      >
        <BuildingIcon className="h-4 w-4 shrink-0 text-slate-400" />
        {!collapsed && <span className="flex-1 truncate">{label}</span>}
      </div>
    );
  }

  return (
    <div
      className="relative"
      onKeyDown={(event) => event.key === "Escape" && setIsOpen(false)}
    >
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={collapsed ? label : undefined}
        className={`${rowClasses} text-left transition-colors hover:bg-slate-50 dark:hover:bg-zinc-900`}
      >
        <BuildingIcon className="h-4 w-4 shrink-0 text-slate-400" />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{label}</span>
            <ChevronDownIcon className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      {isOpen && (
        <>
          {/* Closes the menu on any outside click without a document listener. */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setIsOpen(false)}
          />
          <div
            role="menu"
            className="absolute bottom-full left-0 z-20 mb-1 w-56 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
          >
            <p className="px-3 pb-1 pt-1.5 text-3xs font-bold uppercase text-slate-500">สลับองค์กร</p>
            {tenants.map((tenant) => {
              const current = tenant.id === tenantId;
              return (
                <button
                  key={tenant.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={current}
                  onClick={() => switchTenant(tenant.id)}
                  disabled={switchingTo !== null}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors disabled:opacity-60 ${
                    current
                      ? "font-semibold text-indigo-600 dark:text-indigo-300"
                      : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  }`}
                >
                  <span className="flex-1 truncate">{tenant.name}</span>
                  {switchingTo === tenant.id ? (
                    <span className="text-3xs text-slate-400">กำลังสลับ...</span>
                  ) : (
                    current && <CheckIcon className="h-3.5 w-3.5 shrink-0" />
                  )}
                </button>
              );
            })}
            {error && <p className="px-3 py-1.5 text-3xs text-red-600 dark:text-red-400">{error}</p>}
          </div>
        </>
      )}
    </div>
  );
}
