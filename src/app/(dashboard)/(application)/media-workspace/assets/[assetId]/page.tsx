import { MediaDetailPage } from "@/features/media-workspace/assets";

export default async function Page({ params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  return <MediaDetailPage assetId={assetId} />;
}
