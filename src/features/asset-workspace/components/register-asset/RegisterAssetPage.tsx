"use client";

import { useEffect, useState } from "react";
import { refreshRegistrationOptions, RegistrationRequestError } from "../../services/asset-registration-client";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { RegistrationMethodChoice } from "./RegistrationMethodChoice";
import { RegistrationLoading } from "./RegistrationLoading";
import { RegistrationRecovery } from "./RegistrationRecovery";
import { SingleAssetWizard } from "./SingleAssetWizard";

export function RegisterAssetPage({ single, tenantId, userId }: { single: boolean; tenantId: string; userId: string }) {
  return single ? (
    <RegistrationEntry
      key={`${tenantId}:${userId}`}
      tenantId={tenantId}
      userId={userId}
    />
  ) : (
    <RegistrationMethodChoice
      key={`${tenantId}:${userId}`}
      tenantId={tenantId}
      userId={userId}
    />
  );
}

function RegistrationEntry({ tenantId, userId }: { tenantId: string; userId: string }) {
  const [options, setOptions] = useState<RegistrationOptions | null>(null);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    refreshRegistrationOptions(`${tenantId}:${userId}`, controller.signal).then((rules) => {
      if (alive) setOptions(rules);
    }).catch((failure) => {
      if (alive) setError(failure instanceof RegistrationRequestError
        ? { message: failure.message, status: failure.status }
        : { message: "Registration options could not be loaded. Your saved registration has been kept." });
    });
    return () => { alive = false; controller.abort(); };
  }, [tenantId, userId]);

  if (options) return <SingleAssetWizard tenantId={tenantId} userId={userId} options={options} />;
  if (error) return <RegistrationRecovery tenantId={tenantId} userId={userId} message={error.message} status={error.status} />;
  return <RegistrationLoading />;
}
