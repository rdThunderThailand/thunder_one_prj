"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/lovable/alert-dialog";
import { Button } from "@/components/ui/Button";

export function DraftResumePrompt(props: {
  open: boolean;
  label: string;
  hasServerDraft: boolean;
  dropsSchedule: boolean;
  busy: boolean;
  waiting: boolean;
  conflict: boolean;
  error: string | null;
  discardLabel: string;
  discardNextStep: string;
  canDiscard: boolean;
  onUse: () => void;
  onContinue: () => void;
  onDiscard: () => void;
}) {
  // ADR 0086 §9: the confirmation swaps in place so §4's focus trap holds; Back returns focus to Discard.
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  const [isBackFromConfirm, setIsBackFromConfirm] = useState(false);

  return (
    <AlertDialog open={props.open}>
      <AlertDialogContent onEscapeKeyDown={(event) => event.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isConfirmingDiscard
              ? "ทิ้งการแก้ไขที่ยังไม่บันทึก?"
              : props.hasServerDraft
                ? "Program ก่อนหน้ายังมีการแก้ไขที่ไม่ได้บันทึก"
                : "Program ก่อนหน้ายังไม่ได้บันทึก"}
          </AlertDialogTitle>
          {isConfirmingDiscard ? (
            <AlertDialogDescription>
              {`การแก้ไขที่ยังไม่บันทึกของ draft เดิมจะหายไปและกู้คืนไม่ได้ ส่วนที่บันทึกไว้แล้วไม่ถูกแตะ ${props.discardNextStep}`}
            </AlertDialogDescription>
          ) : (
            <AlertDialogDescription>
              {props.hasServerDraft
                ? "เลือกว่าจะบันทึกหรือทิ้งการแก้ไขนั้นก่อนไปต่อ หรือกลับไปทำ draft เดิมต่อ"
                : "การเริ่มใหม่จะทำให้ชื่อ คำอธิบาย และ tags ที่ยังไม่บันทึกสูญหาย ส่วน draft ที่เคยบันทึกยังอยู่ในหน้า Programs"}
            </AlertDialogDescription>
          )}
          {!isConfirmingDiscard && props.dropsSchedule && (
            <AlertDialogDescription>
              Schedule ที่แก้ไว้ใน draft เดิมยังไม่ถูกต้อง จะไม่ถูกบันทึก
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {!isConfirmingDiscard && props.error && (
          <p role="alert" className="text-sm text-error">{props.error}</p>
        )}
        {isConfirmingDiscard ? (
          <AlertDialogFooter className="gap-2 sm:space-x-0">
            <Button
              variant="outline"
              autoFocus
              onClick={() => {
                setIsConfirmingDiscard(false);
                setIsBackFromConfirm(true);
              }}
            >
              Back
            </Button>
            <Button variant="destructive" onClick={props.onDiscard} disabled={!props.canDiscard}>
              {props.discardLabel}
            </Button>
          </AlertDialogFooter>
        ) : (
          <AlertDialogFooter className="gap-2 sm:flex-col sm:space-x-0">
            {!props.conflict && (
              <Button className="w-full" onClick={props.onUse} disabled={props.busy || props.waiting}>
                {props.busy ? "Saving…" : props.label}
              </Button>
            )}
            <AlertDialogCancel asChild>
              <Button variant="outline" className="w-full" onClick={props.onContinue} disabled={props.busy}>
                Continue the previous draft
              </Button>
            </AlertDialogCancel>
            {props.hasServerDraft && (
              <Button
                variant="ghost"
                className="w-full text-error"
                autoFocus={isBackFromConfirm}
                onClick={() => setIsConfirmingDiscard(true)}
                disabled={!props.canDiscard}
              >
                Discard changes
              </Button>
            )}
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
