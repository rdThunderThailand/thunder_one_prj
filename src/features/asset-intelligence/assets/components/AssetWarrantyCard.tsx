import { DetailSectionUnavailable } from "./DetailSectionUnavailable";

// Core's asset schema has no warranty/contract concept at all — see
// DetailSectionUnavailable's header comment.
export function AssetWarrantyCard() {
  return <DetailSectionUnavailable title="Warranty & Support" />;
}
