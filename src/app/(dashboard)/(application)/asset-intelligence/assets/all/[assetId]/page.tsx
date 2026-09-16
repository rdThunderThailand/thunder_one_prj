import { AssetDetailPage } from "@/features/asset-intelligence/assets";
import { getAsset, getAssetActivity, getAssetAttachments } from "@/features/asset-intelligence/assets/services/asset-list-api";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";

interface AssetIntelligenceAssetDetailPageProps {
  params: Promise<{ assetId: string }>;
}

export default async function AssetIntelligenceAssetDetailPage({ params }: AssetIntelligenceAssetDetailPageProps) {
  const { assetId } = await params;

  const session = await getSession();
  const token = await getAuthToken();
  const tenantId = session !== "forbidden" ? session.tenantId : null;

  const asset = token && tenantId ? await getAsset(token, tenantId, assetId) : null;

  if (!asset) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-200 p-10 text-center text-sm text-zinc-400 dark:border-zinc-800">
        ไม่พบทรัพย์สินนี้ หรือไม่สามารถโหลดข้อมูลได้ในขณะนี้
      </p>
    );
  }

  // Fetched alongside the asset rather than inside AssetDetailPage's own
  // cards so the whole page resolves in one Server Component pass, same
  // pattern as `asset` itself.
  const [activity, attachments] =
    token && tenantId
      ? await Promise.all([getAssetActivity(token, tenantId, assetId), getAssetAttachments(token, tenantId, assetId)])
      : [null, null];

  return <AssetDetailPage asset={asset} activity={activity} attachments={attachments} />;
}
