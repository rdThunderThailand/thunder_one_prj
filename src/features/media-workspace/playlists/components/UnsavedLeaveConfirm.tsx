"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function UnsavedLeaveConfirm({
  onStay,
  onLeave,
}: {
  onStay: () => void;
  onLeave: () => void;
}) {
  return (
    <Modal
      open
      title="ออกโดยไม่บันทึกร่าง?"
      onClose={onStay}
      footer={
        <>
          <Button variant="secondary" onClick={onStay}>
            อยู่ต่อ
          </Button>
          <Button variant="ghost" onClick={onLeave}>
            ออกโดยไม่บันทึก
          </Button>
        </>
      }
    >
      <p>
        ยังไม่ได้บันทึกร่างนี้ลงระบบ — ออกไปตอนนี้ร่างจะค้างอยู่ในเครื่องและถูกทับเมื่อเปิด
        playlist อื่น
      </p>
    </Modal>
  );
}
