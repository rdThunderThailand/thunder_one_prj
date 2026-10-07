"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { HelpSupportConfig } from "../support";
import { HelpDrawer } from "./HelpDrawer";

/**
 * The shell's ? Help entry (Platform Shell dependency, Help Spec §5). Each Topbar variant keeps its
 * own button styling; the panel and its HelpContext are the same everywhere (D-G7-02).
 */
export function HelpTrigger({ className, support, children }: { className: string; support?: HelpSupportConfig; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={cn(className, open && "bg-primary-soft text-primary ring-2 ring-primary/40")}
        aria-label="Help"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {children}
      </button>
      <HelpDrawer open={open} onOpenChange={setOpen} pathname={pathname} support={support} triggerRef={triggerRef} />
    </>
  );
}
