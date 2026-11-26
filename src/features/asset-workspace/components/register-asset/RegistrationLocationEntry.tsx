"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { fetchRegistrationReferences } from "../../services/registration-selector-client";
import type { ReferenceItem } from "../../services/registration-selector-contract";
import { RegistrationLoading } from "./RegistrationLoading";
import { SingleAssetWizard } from "./SingleAssetWizard";

// Register Asset from a Location: pre-select that location in a fresh draft, the same way a category link does.
// The selector returns active locations only. An invalid, inactive or unreachable location opens the normal
// wizard, where the user picks the location in step 3.
export function RegistrationLocationEntry({ tenantId, userId, locationId, options }: {
  tenantId: string; userId: string; locationId: string | string[]; options: RegistrationOptions;
}) {
  const parsed = z.guid().transform((value) => value.toLowerCase()).safeParse(locationId);
  const id = parsed.success ? parsed.data : null;
  const [location, setLocation] = useState<ReferenceItem | null | undefined>(id ? undefined : null);
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    fetchRegistrationReferences(`${tenantId}:${userId}`, { kind: "locations", id }, controller.signal)
      .then((page) => setLocation(page.items.find((item) => item.id === id) ?? null))
      .catch(() => {
        if (!controller.signal.aborted) setLocation(null);
      });
    return () => controller.abort();
  }, [tenantId, userId, id]);

  if (location === undefined) return <RegistrationLoading />;
  return (
    <SingleAssetWizard
      tenantId={tenantId}
      userId={userId}
      options={options}
      initialLocation={location ?? undefined}
    />
  );
}
