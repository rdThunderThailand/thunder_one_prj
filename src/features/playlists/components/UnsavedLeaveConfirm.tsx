"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function UnsavedLeaveConfirm({
  onStay,
  onLeave,
}: {
  onStay: () => void;
  onLeave: () => void;
}) {
  return (
    <Card className="flex items-center justify-between gap-4 border-amber-200 p-4 dark:border-amber-900">
      <p className="text-sm text-amber-700 dark:text-amber-400">
        ยังไม่ได้บันทึกร่างนี้ลงระบบ — ออกไปตอนนี้ร่างจะค้างอยู่ในเครื่องและถูกทับเมื่อเปิด
        playlist อื่น
      </p>
      <span className="flex shrink-0 gap-2">
        <Button variant="secondary" onClick={onStay}>
          อยู่ต่อ
        </Button>
        <Button variant="ghost" onClick={onLeave}>
          ออกโดยไม่บันทึก
        </Button>
      </span>
    </Card>
  );
}
