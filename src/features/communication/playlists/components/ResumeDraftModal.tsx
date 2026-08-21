"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { ResumePromptKind } from "../resume-prompt";

export function ResumeDraftModal({
  kind,
  playlistName,
  onResume,
  onStartFresh,
}: {
  kind: ResumePromptKind;
  playlistName: string;
  onResume: () => void;
  onStartFresh: () => void;
}) {
  const title = kind === "editing" ? "กำลังแก้ playlist ค้างไว้" : "มี draft ที่ทำค้างไว้";
  const body =
    kind === "editing" ? (
      <>
        <p>
          พบว่ากำลังแก้ไข playlist «{playlistName || "ไม่ทราบชื่อ"}» ค้างไว้ในเครื่องนี้ —
          จะทำต่อจากเดิม หรือเริ่มสร้าง playlist ใหม่?
        </p>
        <p>เริ่มใหม่จะล้างเฉพาะร่างในเครื่อง ไม่แตะ playlist ที่บันทึกไว้แล้วในระบบ</p>
      </>
    ) : (
      <>
        <p>เจอร่าง playlist ที่ทำค้างไว้ในเครื่องนี้ — จะทำต่อจากเดิม หรือเริ่มใหม่?</p>
        <p>เริ่มใหม่จะล้างเฉพาะร่างในเครื่องนี้</p>
      </>
    );

  return (
    <Modal
      open={kind !== null}
      onClose={onResume}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onStartFresh}>
            เริ่มใหม่
          </Button>
          <Button variant="primary" onClick={onResume}>
            ทำต่อ
          </Button>
        </>
      }
    >
      {body}
    </Modal>
  );
}
