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

export type SharedSubject = "Playlist" | "Layout";

/** The sentence shown next to Apply, whether or not a dialog follows (ADR 0083). */
export function SharedWriteNote({ subject }: { subject: SharedSubject }) {
  return (
    <p className="rounded-md bg-warning-soft px-3 py-2 text-xs text-warning">
      การเปลี่ยนนี้บันทึกลง {subject} ทันทีเมื่อกด Apply และจะไม่ย้อนกลับแม้ทิ้ง draft นี้
    </p>
  );
}

/**
 * Confirmation for a write to a Playlist / Layout that other Programs use. `confirm(count)` opens the
 * dialog and resolves with the operator's answer; closing the dialog counts as Cancel. Render `dialog`
 * once next to the control.
 */
export function useSharedWriteConfirm(subject: SharedSubject): {
  confirm: (count: number) => Promise<boolean>;
  dialog: ReactNode;
} {
  const [asking, setAsking] = useState<number | null>(null);
  const answer = useRef<((confirmed: boolean) => void) | null>(null);

  const settle = (confirmed: boolean) => {
    answer.current?.(confirmed);
    answer.current = null;
    setAsking(null);
  };

  const confirm = (count: number) =>
    new Promise<boolean>((resolve) => {
      answer.current = resolve;
      setAsking(count);
    });

  const dialog = (
    <AlertDialog open={asking !== null} onOpenChange={(open) => !open && settle(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>เปลี่ยนรูปแบบการเล่นของ {subject}?</AlertDialogTitle>
          <AlertDialogDescription>
            {subject} นี้ถูกใช้โดย {asking} Program ที่ active หรือ scheduled อยู่ การกด Apply จะบันทึกรูปแบบใหม่ลง {subject} ทันที
            แม้ภายหลังจะทิ้ง draft นี้ ค่าที่บันทึกแล้วก็จะยังอยู่ Program ที่เผยแพร่แล้วจะใช้รูปแบบใหม่เมื่อมีการ Publish Changes
            ที่ครอบคลุม Program นั้น
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction onClick={() => settle(true)}>Apply</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, dialog };
}
