import Link from "next/link";
import { Button } from "@/components/ui/lovable/button";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/icons";

/** FE 02–04 footer: Cancel left; Back and Next, or the saving button on Review, right. */
export function ActionFooter({ cancelHref, showBack, sending, review, canNext, canConfirm, confirmLabel, sendingLabel, onBack, onNext, onConfirm }: {
  cancelHref: string; showBack: boolean; sending: boolean; review: boolean; canNext: boolean; canConfirm: boolean;
  confirmLabel: string; sendingLabel: string; onBack: () => void; onNext: () => void; onConfirm: () => void;
}) {
  return (
    <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
      <Button
        asChild
        variant="outline"
        size="sm"
        className="max-sm:h-10"
      >
        <Link href={cancelHref}>Cancel</Link>
      </Button>
      <div className="flex flex-wrap gap-2">
        {showBack && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="max-sm:h-10"
            disabled={sending}
            onClick={onBack}
          >
            <ArrowLeftIcon
              aria-hidden="true"
              className="size-4"
            />
            Back
          </Button>
        )}
        {review ? (
          <Button
            type="button"
            size="sm"
            className="max-sm:h-10"
            disabled={sending || !canConfirm}
            onClick={onConfirm}
          >
            {sending ? sendingLabel : confirmLabel}
          </Button>
        ) : (
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
        )}
      </div>
    </footer>
  );
}
