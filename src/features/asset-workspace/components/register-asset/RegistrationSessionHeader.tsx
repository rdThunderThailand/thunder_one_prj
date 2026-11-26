import { InfoIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { RegistrationHeader } from "./RegistrationHeader";

export function RegistrationSessionHeader({ step, canSubmit, storageBlocked, retryStorage, storageUnavailable }: {
  step: number; canSubmit: boolean; storageBlocked: boolean; retryStorage: () => void; storageUnavailable: boolean;
}) {
  return (
    <div className="shrink-0 space-y-3">
      <RegistrationHeader step={step} />
      {!canSubmit && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
          <InfoIcon className="h-4 w-4 shrink-0 text-info" />
          Asset creation is temporarily unavailable.
        </p>
      )}
      {storageBlocked && step !== 4 && (
        <div role="alert" className="space-y-2 rounded-control bg-warning-muted p-3 text-xs text-warning">
          <p>Recovery storage is unavailable. Restore it before continuing this registration.</p>
          <Button variant="outline" size="sm" onClick={retryStorage}>Retry recovery storage</Button>
        </div>
      )}
      {storageUnavailable && (
        <p role="alert" className="rounded-control bg-warning-muted p-3 text-xs text-warning">
          Browser draft storage is unavailable. Your latest changes may be lost on refresh.
        </p>
      )}
    </div>
  );
}
