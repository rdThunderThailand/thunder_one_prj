import { DetailSectionUnavailable } from "./DetailSectionUnavailable";

// Core's asset schema has no count/audit-history concept at all — see
// DetailSectionUnavailable's header comment. The Asset Count page
// (AssetCountPage.tsx) is a separate, still-fully-mock feature.
export function AssetLatestCountCard() {
  return <DetailSectionUnavailable title="การตรวจนับล่าสุด" />;
}
