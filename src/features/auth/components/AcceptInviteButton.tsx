"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { acceptInvite } from "../services/auth.service";

// The "already logged in as the invited email" branch — no registration
// needed, just confirm and join. See the accept page's own comment for the
// full 3-way split this is one arm of.
export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setError(null);
    setPending(true);
    try {
      await acceptInvite({ token });
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept this invitation.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button onClick={handleAccept} disabled={pending} className="w-full">
        {pending ? "Joining..." : "Accept & join"}
      </Button>
    </div>
  );
}
