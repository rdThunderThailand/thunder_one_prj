"use client";

// Session detail header actions and tab links (PO 05 §4.9 · checklist §1.1). Core checks the role on every write.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { Button } from "@/components/ui/lovable/button";
import { DETAIL_TABS, detailHref, sessionActions, type SessionDetail } from "../../domain/inventory";
import { CancelSessionDialog } from "./parts";

export function SessionHeaderActions({ session }: { session: SessionDetail }) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const can = sessionActions(session.status);
  if (!can.continue && !can.cancel) return null;
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
    </div>
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
