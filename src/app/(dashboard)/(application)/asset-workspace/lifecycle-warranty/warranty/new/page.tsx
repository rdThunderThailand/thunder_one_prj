import { WarrantyRoute } from "@/features/asset-workspace/components/lifecycle-warranty/WarrantyRoute";

export default function Page({ searchParams }: { searchParams: Promise<{ from?: string | string[] }> }) {
  return <WarrantyRoute searchParams={searchParams} />;
}
