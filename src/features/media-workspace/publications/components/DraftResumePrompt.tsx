"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/lovable/alert-dialog";
import { Button } from "@/components/ui/lovable/button";

export function DraftResumePrompt(props: {
  open: boolean;
  label: string;
  hasServerDraft: boolean;
  dropsSchedule: boolean;
  busy: boolean;
  waiting: boolean;
  conflict: boolean;
  error: string | null;
  onUse: () => void;
  onContinue: () => void;
}) {
  return (
    <AlertDialog open={props.open}>
      <AlertDialogContent onEscapeKeyDown={(event) => event.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>มี draft ที่ยังบันทึกไม่ครบ</AlertDialogTitle>
          <AlertDialogDescription>
            {props.hasServerDraft
              ? "บันทึกการแก้ไขของ draft เดิมก่อนเริ่ม Program ใหม่ โดย draft เดิมยังอยู่ในหน้า Programs"
              : "การเริ่มใหม่จะทำให้ชื่อ คำอธิบาย และ tags ที่ยังไม่บันทึกสูญหาย ส่วน draft ที่เคยบันทึกยังอยู่ในหน้า Programs"}
          </AlertDialogDescription>
          {props.dropsSchedule && (
            <AlertDialogDescription>
              Schedule ที่แก้ไว้ใน draft เดิมยังไม่ถูกต้อง จะไม่ถูกบันทึก
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {props.error && (
          <p role="alert" className="text-sm text-danger">{props.error}</p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={props.onContinue} disabled={props.busy}>
              Continue the previous draft
            </Button>
          </AlertDialogCancel>
          {!props.conflict && (
            <Button onClick={props.onUse} disabled={props.busy || props.waiting}>
              {props.busy ? "Saving…" : props.label}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
