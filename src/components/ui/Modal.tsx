"use client";

import { useRef, type ReactNode } from "react";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogDescription } from "./Dialog";
import { cn } from "@/lib/utils";

type ModalSize = "md" | "lg" | "form" | "xl" | "preview";

const sizeClasses: Record<ModalSize, string> = {
  md: "max-w-md",
  lg: "max-w-2xl",
  form: "max-w-3xl",
  xl: "max-w-6xl",
  preview: "max-w-[90rem]",
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer: ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  hideTitle?: boolean;
  titleClassName?: string;
  overflowVisible?: boolean;
}

export function Modal({ open, onClose, title, description, children, footer, size = "md", showCloseButton = false, hideTitle = false, titleClassName = "", overflowVisible = false }: ModalProps) {
  const opener = useRef<HTMLElement | null>(null);

  // Exit animation would delay the former native Modal's immediate close and focus return.
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-t1-black/40 data-[state=open]:animate-none data-[state=closed]:animate-none!"
        className={cn(
          "block w-[calc(100%-2rem)] max-h-[calc(100%-2rem)] gap-0 rounded-lg border-0 bg-transparent p-0 shadow-none data-[state=open]:animate-none data-[state=closed]:animate-none!",
          sizeClasses[size],
          overflowVisible ? "overflow-visible" : "overflow-y-auto",
        )}
        onOpenAutoFocus={() => {
          // Controlled Modal callers have no DialogTrigger for Radix to restore focus to.
          opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (opener.current?.isConnected) opener.current.focus({ preventScroll: true });
        }}
      >
        {open && (
          <div className="relative w-full rounded-lg border border-border bg-card p-5">
            <div className={hideTitle ? "sr-only" : "mb-5 pr-8"}>
              <DialogTitle className={cn("text-base font-semibold leading-normal tracking-normal text-foreground", titleClassName)}>{title}</DialogTitle>
              {description && <DialogDescription className="mt-1">{description}</DialogDescription>}
            </div>
            {showCloseButton && (
              <DialogClose asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-xl text-t1-gray-400 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  ×
                </button>
              </DialogClose>
            )}
            <div className="flex flex-col gap-2 text-sm text-foreground">{children}</div>
            <div className="mt-4 flex justify-end gap-2">{footer}</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
