import { notFound, redirect } from "next/navigation";
import { InventoryWizard } from "@/features/asset-workspace/components/inventory/InventoryWizard";
import { ErrorState } from "@/features/asset-workspace/components/states/ErrorState";
import { bangkokToday, detailHref, scopeForMode, toScopeInput, wizardStep } from "@/features/asset-workspace/domain/inventory";
import { previewScopeAction } from "@/features/asset-workspace/services/asset-inventory-actions";
import {
  getInventoryAssignments,
  getInventoryOwners,
  getInventorySession,
  getScopeOptions,
} from "@/features/asset-workspace/services/asset-inventory-api";
import { getInventoryDefaults } from "@/features/asset-workspace/services/asset-settings-api";

// Start Inventory wizard for a Draft (`?step=1|2|3`, `&location=` prefill). Any other status has left the wizard: open
// its detail. Step 3 also reads the assignments and the expected-asset counts Start would freeze.
export default async function InventorySetupPage({ params, searchParams }: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ step?: string | string[]; location?: string | string[] }>;
}) {
  const [{ sessionId }, sp] = await Promise.all([params, searchParams]);
  const [session, owners, options, defaults] = await Promise.all([
    getInventorySession(sessionId),
    getInventoryOwners(),
    getScopeOptions(),
    getInventoryDefaults(),
  ]);
  if (session === "not-found") notFound();
  if (!session) return <ErrorState />;
  if (session.status !== "Draft") redirect(detailHref(session.id));
  const step = wizardStep(typeof sp.step === "string" ? sp.step : undefined, session);
  const review =
    step === 3
      ? await Promise.all([
          getInventoryAssignments(session.id),
          previewScopeAction(session.scopeMode, scopeForMode(session.scopeMode, toScopeInput(session.scope)), 1, 1),
        ]).then(([assignments, preview]) => ({ assignments, preview: preview.ok ? preview : { ok: false as const, message: preview.message } }))
      : undefined;
  return (
    <InventoryWizard
      key={session.updatedAt}
      session={session}
      step={step}
      owners={owners}
      options={options}
      today={bangkokToday()}
      defaults={defaults}
      review={review}
      prefillLocation={typeof sp.location === "string" ? sp.location : undefined}
    />
  );
}
