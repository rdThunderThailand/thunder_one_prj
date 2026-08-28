"use client";

// ponytail: native <dialog> — swap to a portal + animation library only if entry/exit transitions are ever needed
import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, footer, className = "" }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      // showModal() throws if the dialog is already open
      if (!el.open) el.showModal();
    } else {
      el.close();
    }
  }, [open]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    // Clicks on the backdrop have the <dialog> itself as target; content clicks bubble up with a different target.
    if (e.target === ref.current) onClose();
  };

  // m-auto is not decoration: Tailwind preflight zeroes the UA `margin: auto` that
  // centres a modal <dialog>, which otherwise pins itself to the top-left corner.
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={handleBackdropClick}
      className={`m-auto w-[calc(100%-2rem)] max-w-md rounded-lg p-0 backdrop:bg-black/40 ${className}`}
    >
      <div className="w-full rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        <div className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-300">{children}</div>
        <div className="mt-4 flex justify-end gap-2">{footer}</div>
      </div>
    </dialog>
  );
}
