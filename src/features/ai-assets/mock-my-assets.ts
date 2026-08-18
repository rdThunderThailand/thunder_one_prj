// R&D placeholder data for the Employee/User "My Assets" view (requirement doc
// §4.5) — per the repo mapping doc §5 this view lives inside ai-assets rather
// than as its own feature. Separate shape from `Asset` (types/index.ts): this is
// what an employee sees about their own equipment, not the full asset record.
export type MyAssetKind = "laptop" | "monitor" | "phone";

export interface MyAssetItem {
  id: string;
  tag: string;
  model: string;
  kind: MyAssetKind;
  status: "Good" | "Needs attention";
}

export const myAssets: MyAssetItem[] = [
  { id: "nb-021", tag: "NB-021", model: "Dell Latitude 5450", kind: "laptop", status: "Good" },
  { id: "mon-019", tag: "MON-019", model: "Dell 27\" Monitor", kind: "monitor", status: "Good" },
  { id: "phone-008", tag: "PHONE-008", model: "iPhone 14", kind: "phone", status: "Good" },
];
