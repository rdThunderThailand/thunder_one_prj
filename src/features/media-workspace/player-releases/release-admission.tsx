"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/lovable/alert-dialog";
import { Badge } from "@/components/ui/lovable/badge";
import { Button } from "@/components/ui/lovable/button";
import { admitPlayerRelease, revokePlayerRelease } from "./actions";

type Admitted = { id: string; status: "ready" | "revoked" } | undefined;

/** ADR 0028 §4 and §8: admit an uploaded release for auto update, or revoke it. */
export function ReleaseAdmission({ downloadId, label, admitted }: { downloadId: string; label: string; admitted: Admitted }) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState("");

  async function run(action: () => Promise<{ data: unknown } | { error: string }>) {
    setIsBusy(true);
    setError("");
    const result = await action();
    setIsBusy(false);
    setIsConfirming(false);
    if ("error" in result) setError(result.error);
    else router.refresh();
  }

  return (
    <div className="grid justify-items-start gap-2">
      {admitted?.status === "revoked" ? (
        <Badge variant="danger">Revoked</Badge>
      ) : admitted ? (
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="success">Admitted</Badge>
          <Button variant="outline" disabled={isBusy} onClick={() => setIsConfirming(true)}>Revoke</Button>
        </div>
      ) : (
        <Button disabled={isBusy} onClick={() => void run(() => admitPlayerRelease(downloadId))}>
          {isBusy ? "Checking signature…" : "Admit for auto update"}
        </Button>
      )}
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      <AlertDialog open={isConfirming} onOpenChange={(next) => { if (!isBusy) setIsConfirming(next); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke {label}?</AlertDialogTitle>
            <AlertDialogDescription>
              Devices stop installing this release and discard a pending download of it. If it is the pilot target, the
              target is cleared. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isBusy || !admitted}
              onClick={(event) => {
                event.preventDefault();
                if (admitted) void run(() => revokePlayerRelease(admitted.id));
              }}
              className="bg-error hover:bg-error"
            >
              {isBusy ? "Revoking…" : "Revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
