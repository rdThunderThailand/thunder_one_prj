import { ArrowLeftIcon, ArrowRightIcon, SpinnerIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/Button";
import { formatCount } from "../../domain/asset-import-format";
import type { ConfirmMode } from "../../domain/asset-import-types";
import type { AssetImportFlow } from "../../hooks/use-asset-import-flow";

export function BulkImportReviewFooter({ flow, processing, frozen, toRegister, missingReason, creator,
  reasonId, valid, selectedWarnings, reviewMode, reviewReason, setTouched, setDialog }: {
  flow: AssetImportFlow; processing: boolean; frozen: boolean; toRegister: number; missingReason: boolean;
  creator: boolean; reasonId: string; valid: number; selectedWarnings: number; reviewMode: ConfirmMode;
  reviewReason: string; setTouched: (value: boolean) => void; setDialog: (value: "confirm") => void;
}) {
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="min-w-20 max-sm:h-10"
        disabled={flow.busy || processing || frozen}
        onClick={flow.showMapping}
      >
        <ArrowLeftIcon className="size-4" />
        <span>Back</span>
      </Button>
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
        <div className="text-right">
          <p className="text-xs font-semibold">
            {processing ? "Registration in progress" : `Register ${formatCount(toRegister)} Assets`}
          </p>
          {!processing && (
            <p className="text-2xs text-muted-foreground">
              {formatCount(valid)} ready + {formatCount(selectedWarnings)} with warnings
            </p>
          )}
        </div>
        <Button
          size="sm"
          className="min-w-24 max-sm:h-10"
          disabled={
            (!frozen && (!toRegister || missingReason)) || flow.busy || processing || !creator || !flow.options?.ready
          }
          aria-label={`Register ${formatCount(toRegister)} Assets`}
          aria-describedby={
            missingReason ? `${reasonId}-hint` : undefined
          }
          onClick={() => {
            if (frozen) { void flow.confirm(reviewMode, reviewReason); return; }
            setTouched(true);
            if (!missingReason) setDialog("confirm");
          }}
        >
          <span>{processing ? "Registering…" : frozen ? "Retry registration" : "Register Assets"}</span>
          {processing ? (
            <SpinnerIcon className="size-4 animate-spin motion-reduce:animate-none" />
          ) : (
            <ArrowRightIcon className="size-4" />
          )}
        </Button>
      </div>
    </>
  );
}
