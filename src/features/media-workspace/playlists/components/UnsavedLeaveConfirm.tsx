"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/lovable/alert-dialog";

export function UnsavedLeaveConfirm({
  onStay,
  onLeave,
}: {
  onStay: () => void;
  onLeave: () => void;
}) {
  return (
    <AlertDialog open onOpenChange={(open) => { if (!open) onStay(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ออกโดยไม่บันทึกร่าง?</AlertDialogTitle>
          <AlertDialogDescription>ยังไม่ได้บันทึกร่างนี้ลงระบบ — ออกไปตอนนี้ร่างจะค้างอยู่ในเครื่องและถูกทับเมื่อเปิด playlist อื่น</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onStay}>อยู่ต่อ</AlertDialogCancel>
          <AlertDialogAction className="bg-danger hover:bg-danger" onClick={onLeave}>ออกโดยไม่บันทึก</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
