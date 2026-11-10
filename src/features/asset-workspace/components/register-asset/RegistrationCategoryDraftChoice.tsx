import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/lovable/button";
import type { ReferenceItem } from "../../services/registration-selector-contract";

export function RegistrationCategoryDraftChoice({ requestedCategory, existingName, onResume, onStartNew, children }: {
  requestedCategory: ReferenceItem; existingName: string; onResume: () => void;
  onStartNew: () => Promise<boolean>; children: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  async function startNew() {
    if (busy) return;
    setBusy(true);
    try { setFailed(!(await onStartNew())); }
    catch { setFailed(true); }
    finally { setBusy(false); }
  }
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-y-auto p-1">
      <Card role="region" aria-labelledby="registration-draft-choice-title"
        className="space-y-4 p-4 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none">
        <h1 id="registration-draft-choice-title" className="text-xl font-extrabold">Continue your saved registration?</h1>
        <p className="break-words text-sm text-muted-foreground">
          Your saved registration{existingName ? ` “${existingName}”` : ""} uses a different category. Resume it to keep its details, or discard it and start a new asset in “{requestedCategory.name || requestedCategory.code || "Selected category"}”.
        </p>
        <p className="text-xs text-muted-foreground">Starting new removes the saved draft and its cached files from this tab. No asset is created by this choice.</p>
        {failed && <p role="alert" className="text-xs text-error">The saved registration could not be cleared. Resume it or restore browser storage before trying again.</p>}
        {children}
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy} onClick={onResume}>Resume saved registration</Button>
          <Button variant="destructive" disabled={busy} onClick={() => void startNew()}>
            {busy ? "Starting new…" : "Discard draft and start new"}
          </Button>
          <Button asChild variant="outline" className={busy ? "pointer-events-none" : undefined}>
            <Link href={`/asset-workspace/categories/${encodeURIComponent(requestedCategory.id)}`} aria-disabled={busy}
              tabIndex={busy ? -1 : undefined}>Back to category</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function RegistrationCategoryStorageNotice() {
  return (
    <div className="h-full min-w-0 overflow-y-auto p-1">
      <Card role="alert" className="space-y-4 p-4 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none">
        <h1 className="text-xl font-extrabold">Check browser draft storage</h1>
        <p className="text-sm text-muted-foreground">Your saved registration could not be read safely. Restore browser storage and reload before starting with this category.</p>
        <Button onClick={() => window.location.reload()}>Reload registration</Button>
        <Button asChild variant="outline" className="ml-2">
          <Link href="/asset-workspace/assets/register?mode=single">Open existing registration</Link>
        </Button>
      </Card>
    </div>
  );
}
