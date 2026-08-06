"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      // The cookie is gone either way; proxy.ts sends unauthenticated traffic to
      // /login, and replace() keeps this page out of the back-button history.
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <Button variant="primary" disabled={isSigningOut} onClick={handleLogout} className="w-full">
      {isSigningOut ? "กำลังออกจากระบบ…" : "ออกจากระบบ"}
    </Button>
  );
}
