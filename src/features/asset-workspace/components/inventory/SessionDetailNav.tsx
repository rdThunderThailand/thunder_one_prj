"use client";

// Session detail header actions and tab links (PO 05 §4.9 · checklist §1.1). Core checks the role on every write.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { MoreIcon, PlayIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Checkbox } from "@/components/ui/lovable/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/lovable/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/lovable/dialog";
import { DETAIL_TABS, detailHref, FINDING_LABEL, sessionActions, sessionProgress, type SessionDetail } from "../../domain/inventory";
import { closeSessionAction, completeSessionAction, type UnresolvedFindings } from "../../services/asset-inventory-actions";
import { CancelSessionDialog, FormError } from "./parts";

export function SessionHeaderActions({ session }: { session: SessionDetail }) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const can = sessionActions(session.status);
  if (!can.continue && !can.cancel && !can.complete && !can.close) return null;
  const hasMenu = can.complete || can.close || can.cancel;
  return (
    <div className="flex items-center gap-2">
      {can.close && (
        <Link
          href={`${detailHref(session.id, "discrepancies")}?state=open`}
          className={buttonClasses("primary")}
        >
          Review &amp; Reconcile
        </Link>
      )}
      {can.continue && (
        <Link
          href={detailHref(session.id, "assets")}
          className={buttonClasses("primary")}
        >
          <PlayIcon
            aria-hidden="true"
            className="mr-2 h-4 w-4"
          />
          Continue Inventory
        </Link>
      )}
      {hasMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="More actions"
            >
              <MoreIcon
                aria-hidden="true"
                className="h-4 w-4"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {can.complete && <DropdownMenuItem onSelect={() => setCompleteOpen(true)}>Complete Inventory</DropdownMenuItem>}
            {can.close && <DropdownMenuItem onSelect={() => setCloseOpen(true)}>Close Session</DropdownMenuItem>}
            {can.cancel && (
              <DropdownMenuItem
                className="text-t1-red-700"
                onSelect={() => setCancelOpen(true)}
              >
                Cancel Session
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
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
      {closeOpen && (
        <CloseSessionDialog
          session={session}
          onClose={() => setCloseOpen(false)}
        />
      )}
    </div>
  );
}

/** Close Session (D2): Core lists the open findings (409 UNRESOLVED_FINDINGS); closing anyway needs a confirmation. */
function CloseSessionDialog({ session, onClose }: { session: SessionDetail; onClose: () => void }) {
  const [unresolved, setUnresolved] = useState<UnresolvedFindings | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function close() {
    setSending(true);
    const res = await closeSessionAction(session.id, session.updatedAt, Boolean(unresolved));
    setSending(false);
    if (res.ok) {
      onClose();
      return;
    }
    if (res.code === "UNRESOLVED_FINDINGS" && res.details && typeof res.details === "object") {
      setUnresolved(res.details as UnresolvedFindings);
      setError(null);
      return;
    }
    setError(res.message);
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
          <DialogTitle className="break-words pr-6 leading-snug">Close {session.name}?</DialogTitle>
          <DialogDescription>A closed session is read only. Results and decisions stay in its history.</DialogDescription>
        </DialogHeader>
        <FormError message={error} />
        {unresolved && (
          <div className="space-y-2">
            <p
              role="alert"
              className="text-sm font-medium"
            >
              {unresolved.open.toLocaleString()} {unresolved.open === 1 ? "discrepancy is" : "discrepancies are"} still open.
            </p>
            <ul className="max-h-48 divide-y divide-border overflow-y-auto rounded-lg border border-border text-sm">
              {unresolved.items.map((f) => (
                <li
                  key={f.id}
                  className="flex justify-between gap-2 px-3 py-2"
                >
                  <span className="min-w-0 truncate">{f.asset?.name ?? f.unexpectedIdentifier ?? "—"}</span>
                  <span className="shrink-0 text-muted-foreground">{FINDING_LABEL[f.type] ?? f.type}</span>
                </li>
              ))}
            </ul>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={confirmed}
                onCheckedChange={(v) => setConfirmed(v === true)}
                className="mt-0.5"
              />
              Close with these discrepancies unresolved
            </label>
          </div>
        )}
        <DialogFooter className="gap-2 sm:space-x-0">
          <Button
            variant="outline"
            disabled={sending}
            onClick={onClose}
          >
            Keep Open
          </Button>
          <Button
            disabled={sending || (Boolean(unresolved) && !confirmed)}
            onClick={() => void close()}
          >
            {sending ? "Closing…" : unresolved ? "Close Anyway" : "Close Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

export function SessionTabs({ sessionId, discrepancies = 0 }: { sessionId: string; discrepancies?: number }) {
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
            {tab.key === "discrepancies" && discrepancies > 0 && (
              <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-error px-1.5 text-xs font-semibold text-white">
                {discrepancies}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
