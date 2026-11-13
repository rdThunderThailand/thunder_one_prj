import { notFound, redirect } from "next/navigation";
import { detailHref } from "@/features/asset-workspace/domain/inventory";
import { getInventorySession } from "@/features/asset-workspace/services/asset-inventory-api";

// A Draft lives in the wizard; every other session opens on Overview. Each tab is its own route under `(detail)`.
export default async function InventorySessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const session = await getInventorySession(sessionId);
  if (session === "not-found") notFound();
  redirect(session?.status === "Draft" ? `/asset-workspace/inventory/${session.id}/setup` : detailHref(sessionId));
}
