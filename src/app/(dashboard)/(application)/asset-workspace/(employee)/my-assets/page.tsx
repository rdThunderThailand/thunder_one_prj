import { MyAssetsView } from "@/features/asset-workspace/employee/my-assets/MyAssetsView";
import { getMyAssetChoices, getMyAssets } from "@/features/asset-workspace/employee/my-assets/my-assets-api";
import { MY_ASSET_TABS, myAssetsQuery } from "@/features/asset-workspace/employee/my-assets/my-assets-query";
import type { AssetSearchParams } from "@/features/asset-workspace/services/assets-list-query";

// My Assets (EMP-02, UC-002). Search, filters, tab and page live in the URL; Core limits rows to the caller.
export default async function MyAssetsPage({ searchParams }: { searchParams: Promise<AssetSearchParams> }) {
  const sp = await searchParams;
  const query = myAssetsQuery(sp);
  // Tab counts use the same search and filters as the list (PO mock 02: "All 6 · Active 6 …").
  const countFor = async (tab: string) => {
    const q = myAssetsQuery({ ...sp, tab, page: undefined, pageSize: "1" });
    return q ? ((await getMyAssets(q))?.total ?? null) : null;
  };
  const [data, choices, ...tabCounts] = await Promise.all([
    query ? getMyAssets(query) : null,
    getMyAssetChoices(),
    ...MY_ASSET_TABS.map((tab) => countFor(tab.key)),
  ]);
  const counts = Object.fromEntries(MY_ASSET_TABS.map((tab, i) => [tab.key, tabCounts[i]]));
  const filtered = ["q", "category_id", "location_id", "condition"].some((key) => sp[key]) || (sp.tab !== undefined && sp.tab !== "all");
  const listSearch = new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => typeof e[1] === "string")).toString();
  return (
    <MyAssetsView
      data={data}
      counts={counts}
      choices={choices}
      filtered={filtered}
      listSearch={listSearch}
    />
  );
}
