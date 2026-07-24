"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-sm px-3 py-1 rounded border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
    >
      Logout
    </button>
  );
}
