"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ChevronDownIcon } from "@/components/ui/icons";

interface UserMenuProps {
  userName: string;
  userRole: string;
}

export function UserMenu({ userName, userRole }: UserMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

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
        className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-zinc-50 dark:hover:bg-zinc-900"
      >
        <Avatar name={userName} />
        <span className="text-left leading-tight">
          <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {userName}
          </span>
          <span className="block text-xs text-zinc-500 dark:text-zinc-400">{userRole}</span>
        </span>
        <ChevronDownIcon className="h-4 w-4 text-zinc-400" />
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
            className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={isSigningOut}
              className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              {isSigningOut ? "Signing out..." : "Log out"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
