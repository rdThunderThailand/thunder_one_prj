import { MyAssetsView } from "@/features/asset-workspace/employee/my-assets/MyAssetsView";
import { getMyAssetChoices, getMyAssets } from "@/features/asset-workspace/employee/my-assets/my-assets-api";
import { myAssetsQuery } from "@/features/asset-workspace/employee/my-assets/my-assets-query";
import type { AssetSearchParams } from "@/features/asset-workspace/services/assets-list-query";

// My Assets (EMP-02, UC-002). Search, filters, tab and page live in the URL; Core limits rows to the caller.
export default async function MyAssetsPage({ searchParams }: { searchParams: Promise<AssetSearchParams> }) {
  const sp = await searchParams;
  const query = myAssetsQuery(sp);
  const [data, choices] = await Promise.all([query ? getMyAssets(query) : null, getMyAssetChoices()]);
  const filtered = ["q", "category_id", "location_id", "condition"].some((key) => sp[key]) || (sp.tab !== undefined && sp.tab !== "all");
  const listSearch = new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => typeof e[1] === "string")).toString();
  return (
    <MyAssetsView
      data={data}
      choices={choices}
      filtered={filtered}
      listSearch={listSearch}
    />
  );
}
