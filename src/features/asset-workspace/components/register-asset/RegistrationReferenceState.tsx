import { Button } from "@/components/ui/lovable/button";
import type { RegistrationDraft } from "../../domain/registration-draft";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { referenceId, referenceStatus } from "../../domain/registration-references";
import { selectorKinds } from "../../services/registration-selector-contract";

export function RegistrationReferenceState({ draft, options, onRetry }: { draft: RegistrationDraft; options: RegistrationOptions; onRetry: () => void }) {
  const pending = selectorKinds.filter((kind) => referenceId(draft, kind) && referenceStatus(draft, options, kind) === "pending");
  const failed = selectorKinds.filter((kind) => referenceId(draft, kind) && ["error", "unavailable"].includes(referenceStatus(draft, options, kind)));
  if (!pending.length && !failed.length) return null;
  return (
    <div className="mb-3 space-y-2 rounded-control bg-warning-muted p-3 text-xs text-foreground">
      {pending.length > 0 && <p role="status">Saved selections need validation in their related steps.</p>}
      {failed.map((kind) => (
        <p key={kind} role="alert">{options.referenceValidation?.[kind]?.message || "A saved reference could not be validated. Your information has been kept."}</p>
      ))}
      {failed.length > 0 && <Button variant="outline" size="sm" onClick={onRetry}>Retry selection validation</Button>}
    </div>
  );
}
