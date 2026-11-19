import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/lovable/alert-dialog";
import { formatCount } from "../../domain/asset-import-format";
import type { ConfirmMode, ImportBatch } from "../../domain/asset-import-types";
import type { AssetImportFlow } from "../../hooks/use-asset-import-flow";

export function BulkImportReviewDialogs({ dialog, setDialog, batch, toRegister, error, reviewMode, warning,
  flow, creator, missingReason, mode, reason, setTouched }: {
  dialog: "confirm" | "mapping" | null; setDialog: (value: "confirm" | "mapping" | null) => void;
  batch: ImportBatch; toRegister: number; error: number; reviewMode: ConfirmMode; warning: number;
  flow: AssetImportFlow; creator: boolean; missingReason: boolean; mode: ConfirmMode; reason: string;
  setTouched: (value: boolean) => void;
}) {
  return (
    <AlertDialog
      open={dialog !== null}
      onOpenChange={(open) => {
        if (!open) setDialog(null);
      }}
    >
      <AlertDialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {dialog === "mapping"
              ? "Change the mapping?"
              : `Register ${formatCount(toRegister)} assets?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {dialog === "mapping"
              ? (batch.editedCount ? `You have ${batch.editedCount} row edits. Changing the mapping will remove them.` : "Current results will be removed and the file checked again.")
              : `This cannot be undone.${skippedText(error, reviewMode === "ready_only" ? warning : 0)}`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={flow.busy}>
            {"Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={flow.busy || !creator}
            onClick={() => {
              if (dialog === "mapping") void flow.editMapping();
              else if (!missingReason && creator) void flow.confirm(mode, reason);
              else setTouched(true);
            }}
          >
            {dialog === "mapping" ? "Continue" : "Register"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function skippedText(error: number, warning: number) {
  const parts = [error && `${formatCount(error)} error ${error === 1 ? "row" : "rows"}`,
    warning && `${formatCount(warning)} warning ${warning === 1 ? "row" : "rows"}`].filter(Boolean);
  return parts.length ? ` ${parts.join(" and ")} will be skipped.` : "";
}
