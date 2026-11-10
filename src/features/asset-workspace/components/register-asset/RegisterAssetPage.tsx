"use client";

import { useEffect, useState } from "react";
import { refreshRegistrationOptions, RegistrationRequestError } from "../../services/asset-registration-client";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { RegistrationMethodChoice } from "./RegistrationMethodChoice";
import { RegistrationLoading } from "./RegistrationLoading";
import { RegistrationRecovery } from "./RegistrationRecovery";
import { SingleAssetWizard } from "./SingleAssetWizard";
import { RegistrationCategoryEntry } from "./RegistrationCategoryEntry";
import { RegistrationLocationEntry } from "./RegistrationLocationEntry";

export function RegisterAssetPage({ single, tenantId, userId, initialCategoryId, initialLocationId }: {
  single: boolean; tenantId: string; userId: string; initialCategoryId?: string | string[]; initialLocationId?: string | string[];
}) {
  return single ? (
    <RegistrationEntry
      key={initialCategoryId !== undefined ? `${tenantId}:${userId}:category:${JSON.stringify(initialCategoryId)}`
        : initialLocationId !== undefined ? `${tenantId}:${userId}:location:${JSON.stringify(initialLocationId)}` : `${tenantId}:${userId}`}
      tenantId={tenantId}
      userId={userId}
      initialCategoryId={initialCategoryId}
      initialLocationId={initialLocationId}
    />
  ) : (
    <RegistrationMethodChoice
      key={`${tenantId}:${userId}`}
      tenantId={tenantId}
      userId={userId}
    />
  );
}

function RegistrationEntry({ tenantId, userId, initialCategoryId, initialLocationId }: {
  tenantId: string; userId: string; initialCategoryId?: string | string[]; initialLocationId?: string | string[];
}) {
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

  if (options && initialCategoryId !== undefined) {
    return <RegistrationCategoryEntry tenantId={tenantId} userId={userId} categoryId={initialCategoryId} options={options} />;
  }
  if (options && initialLocationId !== undefined) {
    return <RegistrationLocationEntry tenantId={tenantId} userId={userId} locationId={initialLocationId} options={options} />;
  }
  if (options) return <SingleAssetWizard tenantId={tenantId} userId={userId} options={options} />;
  if (error) return <RegistrationRecovery tenantId={tenantId} userId={userId} message={error.message} status={error.status} initialCategoryId={initialCategoryId} />;
  return <RegistrationLoading />;
}
