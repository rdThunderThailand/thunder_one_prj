import { redirect } from "next/navigation";

// Asset/IT Manager is the landing persona for the Asset Intelligence app.
// CEO used to hold that spot (docs/adr/0022) but moved to Thunder One's
// shell-level Mission Control when the app narrowed to three personas —
// docs/adr/0033-thunder-one-shell-launcher-not-dropdown.md.
export default function AssetIntelligenceRootPage() {
  redirect("/asset-intelligence/assets");
}
