"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { HelpDrawer } from "./HelpDrawer";

/**
 * The shell's ? Help entry (Platform Shell dependency, Help Spec §5). Each Topbar variant keeps its
 * own button styling; the drawer and its HelpContext are the same everywhere (D-G7-02).
 */
export function HelpTrigger({ className, supportUrl, children }: { className: string; supportUrl?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <>
      <button type="button" className={className} aria-label="Help" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        {children}
      </button>
      <HelpDrawer open={open} onOpenChange={setOpen} pathname={pathname} supportUrl={supportUrl} />
    </>
  );
}
