"use client";

// Session detail header actions and tab links (PO 05 §4.9 · checklist §1.1). Core checks the role on every write.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { Button } from "@/components/ui/lovable/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/lovable/dialog";
import { DETAIL_TABS, detailHref, sessionActions, sessionProgress, type SessionDetail } from "../../domain/inventory";
import { completeSessionAction } from "../../services/asset-inventory-actions";
import { CancelSessionDialog, FormError } from "./parts";

export function SessionHeaderActions({ session }: { session: SessionDetail }) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const can = sessionActions(session.status);
  if (!can.continue && !can.cancel && !can.complete) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {can.cancel && (
        <Button
          variant="outline"
          className="text-t1-red-700"
          onClick={() => setCancelOpen(true)}
        >
          Cancel Session
        </Button>
      )}
      {can.complete && (
        <Button
          variant="outline"
          onClick={() => setCompleteOpen(true)}
        >
          Complete Inventory
        </Button>
      )}
      {can.continue && (
        <Link
          href={detailHref(session.id, "assets")}
          className={buttonClasses("primary")}
        >
          Continue Inventory
        </Link>
      )}
      <CancelSessionDialog
        session={session}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
      />
      {completeOpen && (
        <CompleteSessionDialog
          session={session}
          onClose={() => setCompleteOpen(false)}
        />
      )}
    </div>
  );
}

/** Complete Inventory (D1): 100% is not required; unchecked assets stay Remaining and the session moves to Completed. */
function CompleteSessionDialog({ session, onClose }: { session: SessionDetail; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const { remaining } = session.counts;
  const { discrepancies } = sessionProgress(session.counts);

  async function confirm() {
    setSending(true);
    const res = await completeSessionAction(session.id, session.updatedAt);
    setSending(false);
    if (res.ok) onClose();
    else setError(res.message);
  }

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o && !sending) onClose();
      }}
    >
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-xl"
        aria-busy={sending}
      >
        <DialogHeader>
          <DialogTitle className="break-words pr-6 leading-snug">Complete {session.name}?</DialogTitle>
          <DialogDescription>Verification stops. Discrepancies can then be reconciled before the session is closed.</DialogDescription>
        </DialogHeader>
        <FormError message={error} />
        <ul className="space-y-1 text-sm">
          <li>
            <span className="font-semibold tabular-nums">{remaining.toLocaleString()}</span> of{" "}
            {session.counts.expected.toLocaleString()} assets not checked yet
            {remaining > 0 && <span className="text-muted-foreground"> · they stay Remaining</span>}
          </li>
          <li>
            <span className="font-semibold tabular-nums">{discrepancies.toLocaleString()}</span>{" "}
            {discrepancies === 1 ? "discrepancy" : "discrepancies"} found
          </li>
        </ul>
        <DialogFooter className="gap-2 sm:space-x-0">
          <Button
            variant="outline"
            disabled={sending}
            onClick={onClose}
          >
            Keep Verifying
          </Button>
          <Button
            disabled={sending}
            onClick={() => void confirm()}
          >
            {sending ? "Completing…" : "Complete Inventory"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SessionTabs({ sessionId }: { sessionId: string }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Inventory session"
      className="flex gap-1 overflow-x-auto border-b border-border"
    >
      {DETAIL_TABS.map((tab) => {
        const href = detailHref(sessionId, tab.key);
        const active = pathname === href;
        return (
          <Link
            key={tab.key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
              active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
