import { AlertCircleIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { assignmentWriteText } from "./assignment-error-text";

export type ActionSave = { phase: "idle" | "sending" | "failed"; code?: string; uncertain?: boolean };
const RELOAD = ["STALE", "INVALID_STATE", "NOT_FOUND"];

/** Review-step save error for FE 02–04; Reload keeps the user's input. */
export function SaveAlert({ save, action, reloading, onReload }: {
  save: ActionSave; action: "assign" | "transfer" | "return"; reloading: boolean; onReload: () => void;
}) {
  return (
    <>
      {save.phase === "failed" && (
        <div
          role="alert"
          tabIndex={-1}
          className="flex flex-wrap items-start gap-3 rounded-control border border-error bg-error-muted p-3 text-xs text-foreground"
        >
          <AlertCircleIcon
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-error"
          />
          <p className="min-w-0 flex-1">{assignmentWriteText(save.code ?? "", save.uncertain, action)}</p>
          {(save.uncertain || RELOAD.includes(save.code ?? "")) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReload}
            >
              Reload
            </Button>
          )}
        </div>
      )}
      {reloading && (
        <p
          role="status"
          className="rounded-control bg-muted p-3 text-xs"
        >
          Reloading asset… Your input stays.
        </p>
      )}
    </>
  );
}
