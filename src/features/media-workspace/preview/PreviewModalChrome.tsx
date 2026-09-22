"use client";

// The Lovable preview dialog shell (`layout-preview.tsx` / `playlist-preview.tsx`): a near
// full-viewport `bg-program` sheet with a close button, a title block and the actions on the
// right. Both preview modals share it so they only differ in body and actions (ADR 0076).

import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/lovable/dialog";
import { XIcon } from "@/components/ui/icons";

/** Outline button on the dark sheet — Lovable's `border-primary-foreground/20 bg-transparent`. */
export const previewOutlineButton =
  "border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground";

export function PreviewModalChrome({ open, onClose, title, badge, subtitle, description, actions, children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Inline next to the title: the live-simulation dot or the Playlist name. */
  badge?: ReactNode;
  subtitle: ReactNode;
  /** Screen-reader description of what the sheet shows. */
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="flex h-[96vh] w-[98vw] max-w-none flex-col gap-0 overflow-hidden border-transparent bg-program p-0 text-primary-foreground sm:max-w-none [&>button:last-of-type]:hidden">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-primary-foreground/10 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md hover:bg-primary-foreground/10"
          >
            <XIcon />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="text-sm font-bold">{title}</h2>
              {badge}
            </div>
            <p className="mt-0.5 text-[11px] text-primary-foreground/60">{subtitle}</p>
          </div>
          {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
        </header>
        {children}
      </DialogContent>
    </Dialog>
  );
}
