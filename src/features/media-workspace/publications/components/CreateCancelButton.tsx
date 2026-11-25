"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Button, buttonVariants } from "@/components/ui/Button";
import { createExitPlan } from "../create-exit";
import { useIsDraftDirty, usePublicationDraftStore } from "../store/usePublicationDraftStore";

/** ADR 0124: clears only the local draft — nothing is sent to or deleted from the server. */
export function CreateCancelButton({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const isDirty = useIsDraftDirty();
  const hasServerDraft = usePublicationDraftStore((s) => Boolean(s.publicationId));
  const [isConfirming, setIsConfirming] = useState(false);
  const plan = createExitPlan({ isDirty, hasServerDraft });

  const leave = () => {
    usePublicationDraftStore.getState().cancelDraft();
    if (plan.toast) toast.success(plan.toast);
    router.push("/media-workspace/program");
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => (plan.confirm ? setIsConfirming(true) : leave())}
      >
        Cancel
      </Button>
      <AlertDialog
        open={isConfirming}
        onOpenChange={setIsConfirming}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ทิ้งการเปลี่ยนแปลงแล้วออก?</AlertDialogTitle>
            <AlertDialogDescription>{plan.confirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={leave}
            >
              Discard and leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
