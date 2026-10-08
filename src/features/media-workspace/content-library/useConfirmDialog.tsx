"use client";

import { useRef, useState, type ReactNode } from "react";
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

export type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  isDestructive?: boolean;
};

/**
 * The modal replacement for `window.confirm`. `confirm(options)` opens the dialog and resolves with the
 * operator's answer; closing it (Esc, backdrop) counts as Cancel. Render `dialog` once next to the control.
 * Same shape as `useSharedWriteConfirm`, which keeps its own copy for the shared-write wording.
 */
export function useConfirmDialog(): {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  dialog: ReactNode;
} {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const answer = useRef<((confirmed: boolean) => void) | null>(null);

  const settle = (confirmed: boolean) => {
    answer.current?.(confirmed);
    answer.current = null;
    setOptions(null);
  };

  const confirm = (next: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      answer.current?.(false);
      answer.current = resolve;
      setOptions(next);
    });

  const dialog = (
    <AlertDialog open={options !== null} onOpenChange={(open) => !open && settle(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options?.title}</AlertDialogTitle>
          <AlertDialogDescription>{options?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={options?.isDestructive ? "bg-danger hover:bg-danger" : undefined}
            onClick={() => settle(true)}
          >
            {options?.confirmLabel ?? "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, dialog };
}
