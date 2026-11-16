import { redirect } from "next/navigation";

// Location Detail opens on Overview; each tab is its own route.
export default async function LocationDetailPage({ params }: { params: Promise<{ locationId: string }> }) {
  const { locationId } = await params;
  redirect(`/asset-workspace/locations/${encodeURIComponent(locationId)}/overview`);
}
