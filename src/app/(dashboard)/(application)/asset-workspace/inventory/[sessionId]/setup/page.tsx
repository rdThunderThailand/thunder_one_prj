import { notFound, redirect } from "next/navigation";
import { InventoryWizard } from "@/features/asset-workspace/components/inventory/InventoryWizard";
import { ErrorState } from "@/features/asset-workspace/components/states/ErrorState";
import { bangkokToday, wizardStep } from "@/features/asset-workspace/domain/inventory";
import { getInventoryOwners, getInventorySession, getScopeOptions } from "@/features/asset-workspace/services/asset-inventory-api";

// Start Inventory wizard for a Draft (`?step=1|2|3`). Any other status has left the wizard: open its detail.
export default async function InventorySetupPage({ params, searchParams }: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ step?: string | string[] }>;
}) {
  const [{ sessionId }, sp] = await Promise.all([params, searchParams]);
  const [session, owners, options] = await Promise.all([getInventorySession(sessionId), getInventoryOwners(), getScopeOptions()]);
  if (session === "not-found") notFound();
  if (!session) return <ErrorState />;
  if (session.status !== "Draft") redirect(`/asset-workspace/inventory/${session.id}`);
  return (
    <InventoryWizard
      key={session.updatedAt}
      session={session}
      step={wizardStep(typeof sp.step === "string" ? sp.step : undefined, session)}
      owners={owners}
      options={options}
      today={bangkokToday()}
    />
  );
}
