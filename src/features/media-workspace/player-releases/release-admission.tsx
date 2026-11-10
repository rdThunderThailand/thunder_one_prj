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
import { admitPlayerRelease, deletePlayerRelease, revokePlayerRelease } from "./actions";

type Admitted = { id: string; status: "ready" | "revoked" } | undefined;

/**
 * ADR 0028 §4 and §8: approve an uploaded release for auto update, or withdraw it; §11 amendment 2: delete one
 * that is not approved. UI terms: ADR 0028 §11 item 5.
 */
export function ReleaseAdmission({ downloadId, label, admitted }: { downloadId: string; label: string; admitted: Admitted }) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [confirming, setConfirming] = useState<"withdraw" | "delete" | null>(null);
  const [error, setError] = useState("");

  async function run(action: () => Promise<{ data: unknown } | { error: string }>) {
    setIsBusy(true);
    setError("");
    const result = await action();
    setIsBusy(false);
    setConfirming(null);
    if ("error" in result) setError(result.error);
    else router.refresh();
  }

  return (
    <div className="grid justify-items-start gap-2">
      {admitted?.status === "revoked" ? (
        <Badge variant="danger">Withdrawn</Badge>
      ) : admitted ? (
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="success">Approved</Badge>
          <Button variant="outline" disabled={isBusy} onClick={() => setConfirming("withdraw")}>Withdraw</Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={isBusy} onClick={() => void run(() => admitPlayerRelease(downloadId))}>
            {isBusy && !confirming ? "Checking signature…" : "Approve"}
          </Button>
          <Button variant="outline" disabled={isBusy} onClick={() => setConfirming("delete")}>Delete</Button>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      <AlertDialog open={confirming !== null} onOpenChange={(next) => { if (!isBusy && !next) setConfirming(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirming === "delete" ? "Delete" : "Withdraw"} {label}?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirming === "delete"
                ? "Files are removed and the version can be uploaded again. This cannot be undone."
                : "Devices stop installing this release and discard a pending download of it. If it is the version set for the test group, that version is cleared. This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isBusy || (confirming === "withdraw" && !admitted)}
              onClick={(event) => {
                event.preventDefault();
                if (confirming === "delete") void run(() => deletePlayerRelease(downloadId));
                else if (admitted) void run(() => revokePlayerRelease(admitted.id));
              }}
              className="bg-error hover:bg-error"
            >
              {confirming === "delete" ? (isBusy ? "Deleting…" : "Delete") : isBusy ? "Withdrawing…" : "Withdraw"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
