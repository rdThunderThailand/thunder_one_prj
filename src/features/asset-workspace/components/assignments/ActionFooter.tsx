import Link from "next/link";
import { Button } from "@/components/ui/lovable/button";
import { ArrowRightIcon, CheckIcon } from "@/components/ui/icons";

/**
 * FE 02–04 footer, as PO frames 16 / 20–22. Details: Cancel left, Next right.
 * Review: Back left; Confirm right, with Cancel before it when the frame shows one (Return, frame 22).
 */
export function ActionFooter({ cancelHref, showBack, sending, review, reviewCancel = false, canNext, canConfirm, confirmLabel, sendingLabel, onBack, onNext, onConfirm }: {
  cancelHref: string; showBack: boolean; sending: boolean; review: boolean; reviewCancel?: boolean; canNext: boolean; canConfirm: boolean;
  confirmLabel: string; sendingLabel: string; onBack: () => void; onNext: () => void; onConfirm: () => void;
}) {
  const cancel = (
    <Button
      asChild
      variant="outline"
      size="sm"
      className="max-sm:h-10"
    >
      <Link href={cancelHref}>Cancel</Link>
    </Button>
  );
  const back = showBack && (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="max-sm:h-10"
      disabled={sending}
      onClick={onBack}
    >
      Back
    </Button>
  );
  return (
    <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
      {review ? back || <span /> : cancel}
      <div className="flex flex-wrap gap-2">
        {review ? (
          <>
            {reviewCancel && cancel}
            <Button
              type="button"
              size="sm"
              className="max-sm:h-10"
              disabled={sending || !canConfirm}
              onClick={onConfirm}
            >
              {!sending && (
                <CheckIcon
                  aria-hidden="true"
                  className="size-4"
                />
              )}
              {sending ? sendingLabel : confirmLabel}
            </Button>
          </>
        ) : (
          <>
            {back}
            <Button
              type="button"
              size="sm"
              className="max-sm:h-10"
              disabled={!canNext}
              onClick={onNext}
            >
              Next
              <ArrowRightIcon
                aria-hidden="true"
                className="size-4"
              />
            </Button>
          </>
        )}
      </div>
    </footer>
  );
}
