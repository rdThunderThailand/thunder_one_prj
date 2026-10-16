"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ChevronDownIcon, LockIcon, LogoutIcon, SettingsIcon, UserIcon } from "@/components/ui/icons";

interface UserMenuProps {
  userName: string;
  roleLabel?: string | null;
  /** Profile picture URL (Session.avatarUrl); initials when null. */
  avatarUrl?: string | null;
  /** Media Workspace's Topbar (docs/adr/0075 §4) uses the smaller, token-colored
   *  treatment from the Lovable reference instead of the shell's default sizing. */
  variant?: "default" | "compact";
}

export function UserMenu({ userName, roleLabel, avatarUrl = null, variant = "default" }: UserMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const compact = variant === "compact";

  async function handleLogout() {
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      // The cookie is gone either way; proxy.ts sends unauthenticated traffic to
      // /login, and replace() keeps the dashboard out of the back-button history.
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="relative" onKeyDown={(event) => event.key === "Escape" && setIsOpen(false)}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={
          compact
            ? "flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-accent"
            : "flex items-center gap-3 rounded-lg px-1.5 py-1 hover:bg-muted"
        }
      >
        {/* 2026-09-19: 44px -> 32px, matching the design reference's own
            avatar size exactly (measured 32x32). */}
        <Avatar name={userName} src={avatarUrl} size={32} className="shadow-sm" />
        {/* 2026-09-19: matched to the design reference's user-block
            typography direction (bold name, small light role label) — was
            text-base (16px) and a bespoke 12.8px, both noticeably larger
            than the reference's own (very compact) 10px/8px. */}
        <span className="text-left leading-tight">
          <span className={compact ? "block max-w-36 truncate text-xs font-semibold text-foreground" : "block text-2xs font-bold text-foreground"}>
            {userName}
          </span>
          {roleLabel && (
            <span className={compact ? "block text-[10px] text-muted-foreground" : "block text-3xs text-muted-foreground"}>{roleLabel}</span>
          )}
        </span>
        <ChevronDownIcon className={compact ? "h-3.5 w-3.5 text-muted-foreground" : "h-4 w-4 text-muted-foreground"} />
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
            className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-border bg-card py-1 shadow-lg"
          >
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              <UserIcon className="h-4 w-4 text-t1-gray-400" />
              โปรไฟล์ของฉัน
            </Link>
            <Link
              href="/account-security"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              <LockIcon className="h-4 w-4 text-t1-gray-400" />
              บัญชีและความปลอดภัย
            </Link>
            {/* Deep-links into Profile's own "รูปแบบการแสดงผล" card — Core has
                no separate app-settings endpoint to back a standalone page. */}
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              <SettingsIcon className="h-4 w-4 text-t1-gray-400" />
              การตั้งค่าส่วนบุคคล
            </Link>
            <div className="my-1 border-t border-border" />
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={isSigningOut}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-t1-red-700 hover:bg-error-muted disabled:opacity-60"
            >
              <LogoutIcon className="h-4 w-4" />
              {isSigningOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
