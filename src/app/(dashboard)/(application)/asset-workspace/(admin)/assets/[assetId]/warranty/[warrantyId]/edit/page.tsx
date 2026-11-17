import { WarrantyRoute } from "@/features/asset-workspace/components/lifecycle-warranty/WarrantyRoute";

export default function Page({ params, searchParams }: {
  params: Promise<{ assetId: string; warrantyId?: string }>; searchParams: Promise<{ from?: string | string[] }>;
}) {
  return <WarrantyRoute params={params} searchParams={searchParams} />;
}
