"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/lovable/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "../states/ErrorState";
import { useRegistrationConfirmation } from "../../hooks/use-registration-confirmation";
import { registrationDraftKey, removeRegistrationDraft } from "../../services/asset-registration-draft-storage";
import { RegistrationReceipt } from "./RegistrationConfirmation";
import { RegistrationLoading } from "./RegistrationLoading";
import { SingleAssetWizard } from "./SingleAssetWizard";

const subscribe = () => () => {};
export function RegistrationRecovery(props: { tenantId: string; userId: string; message: string }) {
  const [generation, setGeneration] = useState(0);
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  return hydrated ? <RecoveryContent key={`${props.tenantId}:${props.userId}:${generation}`} {...props} onReset={() => setGeneration((value) => value + 1)} /> : <RegistrationLoading />;
}

function RecoveryContent({ tenantId, userId, message, onReset }: { tenantId: string; userId: string; message: string; onReset: () => void }) {
  const router = useRouter();
  const key = registrationDraftKey(tenantId, userId);
  const confirmation = useRegistrationConfirmation(`${key}:confirmation`, `${tenantId}:${userId}`, null);
  const { record, options, busy, uncertain, storageBlocked, error } = confirmation;
  const back = () => router.push("/asset-workspace/assets");
  if (record?.phase === "succeeded" && record.result) {
    return (
      <RegistrationReceipt result={record.result} onBack={back} onAnother={() => {
        if (!removeRegistrationDraft(key) || !confirmation.discard()) return false;
        onReset();
        router.refresh();
        return true;
      }} />
    );
  }
  if (options && !uncertain) return <SingleAssetWizard tenantId={tenantId} userId={userId} options={options} />;
  return (
    <div className="h-full space-y-4 overflow-y-auto overscroll-contain">
      <PageHeader title="Register Asset" subtitle={uncertain ? "Recover the original registration result" : "Registration options are unavailable"} />
      {uncertain && record ? (
        <section className="space-y-3 rounded-card border border-border bg-card p-4">
          <h2 className="break-words text-sm font-semibold">{record.draft.name}</h2>
          <p className="text-xs text-muted-foreground">The creation outcome is not confirmed. Your original request is retained. You can recover its result without loading registration options.</p>
          {busy && <p role="status" className="text-xs text-primary">Recovering the original result…</p>}
          {error && <p role="alert" className="text-xs text-error">{error}</p>}
          <Button disabled={busy || storageBlocked} onClick={() => { void confirmation.start(record.draft, [], () => {}); }}>Retry original request</Button>
        </section>
      ) : (
        <ErrorState title="Could not load registration options" body={error || message} onRetry={() => { void confirmation.refresh(); }} />
      )}
      {storageBlocked && (
        <div className="space-y-2">
          <p role="alert" className="text-xs text-warning">Recovery storage is unavailable. Keep this tab and restore storage before continuing.</p>
          <Button variant="outline" disabled={busy} onClick={confirmation.retryStorage}>Retry recovery storage</Button>
        </div>
      )}
      {busy && !uncertain && <p role="status" className="text-xs text-primary">Loading registration options…</p>}
      <Button variant="outline" disabled={busy} onClick={back}>Back to Assets</Button>
    </div>
  );
}
