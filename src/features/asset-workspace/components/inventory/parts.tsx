"use client";

// Pieces the Start Inventory wizard and the session detail share.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircleIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/lovable/dialog";
import { Label } from "@/components/ui/lovable/label";
import { Textarea } from "@/components/ui/lovable/textarea";
import type { SessionDetail } from "../../domain/inventory";
import { cancelSessionAction } from "../../services/asset-inventory-actions";

const LIST = "/asset-workspace/inventory";

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg bg-error-muted px-3 py-2 text-sm text-t1-red-700"
    >
      <AlertCircleIcon
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0"
      />
      {message}
    </p>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      id={id}
      className="text-xs text-t1-red-700"
    >
      {message}
    </p>
  );
}

export function Breakdown({ title, rows }: { title: string; rows: { id: string; name: string; count: number }[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold uppercase text-muted-foreground">{title}</h3>
      <ul className="space-y-1 text-sm">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex justify-between gap-2"
          >
            <span className="truncate">{r.name}</span>
            <span className="tabular-nums text-muted-foreground">{r.count.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Cancel ──

export function CancelSessionDialog({ session, open, onOpenChange }: {
  session: SessionDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const empty = reason.trim() === "";

  async function confirm() {
    setTouched(true);
    if (empty) return;
    setSending(true);
    const res = await cancelSessionAction(session.id, reason.trim());
    setSending(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    onOpenChange(false);
    router.push(LIST);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!sending) onOpenChange(o);
      }}
    >
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-xl"
        aria-busy={sending}
      >
        <DialogHeader>
          <DialogTitle className="break-words pr-6 leading-snug">Cancel {session.name}?</DialogTitle>
          <DialogDescription>The session stays in the list as Cancelled and can no longer be edited or started.</DialogDescription>
        </DialogHeader>
        <FormError message={error} />
        <div className="space-y-1.5">
          <Label htmlFor="cancel-reason">Reason *</Label>
          <Textarea
            id="cancel-reason"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            aria-invalid={(touched && empty) || undefined}
            aria-describedby="cancel-reason-error"
          />
          <FieldError
            id="cancel-reason-error"
            message={touched && empty ? "Enter a reason." : undefined}
          />
        </div>
        <DialogFooter className="gap-2 sm:space-x-0">
          <Button
            variant="outline"
            disabled={sending}
            onClick={() => onOpenChange(false)}
          >
            Keep Session
          </Button>
          <Button
            variant="destructive"
            disabled={sending}
            onClick={() => void confirm()}
          >
            {sending ? "Cancelling…" : "Cancel Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
