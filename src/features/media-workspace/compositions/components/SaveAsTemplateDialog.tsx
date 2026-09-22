"use client";

// ADR 0052 §4 defines a Template as geometry "named by an operator", so the promotion asks
// rather than deriving a name. Deriving one from the Composition would name the shared thing
// after a single instance of it — the exact confusion ADR 0052 §2 exists to prevent — and
// `layouts` is UNIQUE (tenant_id, name), so a derived name would sometimes land as
// "Menu Board (Copy)" on a Template that is not a copy of anything.
//
// It writes nothing: the page still owns the save sequence, this only collects the name.
// The caller mounts it only while it is open, so the prefill re-reads the Composition's
// current name on every open — reset by remounting, not by effect (commit e877e4c).

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function SaveAsTemplateDialog({
  defaultName,
  takenNames,
  onClose,
  onConfirm,
}: {
  /** The Composition's name, offered as a starting point rather than as the answer. */
  defaultName: string;
  /** Existing Template names, so the collision is caught here instead of coming back as a
   *  unique violation from a button the operator thought did one thing. */
  takenNames: string[];
  onClose: () => void;
  onConfirm: (name: string) => void;
}) {
  const [name, setName] = useState(defaultName);
  const trimmed = name.trim();
  const taken = takenNames.includes(trimmed);

  return (
    <Modal open onClose={onClose} title="Save as Template" footer={<>
      <Button type="button" variant="secondary" onClick={onClose}>ยกเลิก</Button>
      <Button type="button" disabled={!trimmed || taken} onClick={() => onConfirm(trimmed)}>
        Save as Template
      </Button>
    </>}>
      <p className="text-zinc-500 dark:text-zinc-400">
        Template คือ geometry ที่ Layout อื่นนำไปใช้ร่วมกันได้ — ตั้งชื่อตามรูปแบบการวาง Zone
        ไม่ใช่ตามงานที่ใช้อยู่ตอนนี้
      </p>
      <label className="space-y-1">
        <span>Template name</span>
        <input
          aria-label="Template name"
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      {taken && <p className="text-red-500">ชื่อนี้ถูกใช้ไปแล้ว กรุณาตั้งชื่ออื่น</p>}
    </Modal>
  );
}
