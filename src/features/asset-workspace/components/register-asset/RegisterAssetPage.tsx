"use client";

import { useEffect, useState } from "react";
import { refreshRegistrationOptions, RegistrationRequestError } from "../../services/asset-registration-client";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { RegistrationMethodChoice } from "./RegistrationMethodChoice";
import { RegistrationLoading } from "./RegistrationLoading";
import { RegistrationRecovery } from "./RegistrationRecovery";
import { SingleAssetWizard } from "./SingleAssetWizard";
import { RegistrationCategoryEntry } from "./RegistrationCategoryEntry";

export function RegisterAssetPage({ single, tenantId, userId, initialCategoryId }: {
  single: boolean; tenantId: string; userId: string; initialCategoryId?: string | string[];
}) {
  return single ? (
    <RegistrationEntry
      key={initialCategoryId === undefined ? `${tenantId}:${userId}` : `${tenantId}:${userId}:category:${JSON.stringify(initialCategoryId)}`}
      tenantId={tenantId}
      userId={userId}
      initialCategoryId={initialCategoryId}
    />
  ) : (
    <RegistrationMethodChoice
      key={`${tenantId}:${userId}`}
      tenantId={tenantId}
      userId={userId}
    />
  );
}

function RegistrationEntry({ tenantId, userId, initialCategoryId }: { tenantId: string; userId: string; initialCategoryId?: string | string[] }) {
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

  if (options) return initialCategoryId === undefined
    ? <SingleAssetWizard tenantId={tenantId} userId={userId} options={options} />
    : <RegistrationCategoryEntry tenantId={tenantId} userId={userId} categoryId={initialCategoryId} options={options} />;
  if (error) return <RegistrationRecovery tenantId={tenantId} userId={userId} message={error.message} status={error.status} initialCategoryId={initialCategoryId} />;
  return <RegistrationLoading />;
}
