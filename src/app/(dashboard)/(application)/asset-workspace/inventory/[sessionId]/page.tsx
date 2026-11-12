import { notFound, redirect } from "next/navigation";
import { ScreenPlaceholder } from "@/features/asset-workspace/components/ScreenPlaceholder";
import { getInventorySession } from "@/features/asset-workspace/services/asset-inventory-api";

// A Draft has no detail page yet: it opens the wizard. The session detail is slice I2.
export default async function InventorySessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const session = await getInventorySession(sessionId);
  if (session === "not-found") notFound();
  if (session?.status === "Draft") redirect(`/asset-workspace/inventory/${session.id}/setup`);
  return (
    <ScreenPlaceholder
      title="Inventory Session"
      spec="UC-007 · 05 §4.9"
    />
  );
}
