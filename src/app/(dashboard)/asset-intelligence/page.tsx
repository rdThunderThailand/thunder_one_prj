import { redirect } from "next/navigation";

// Mission Control is the landing page for the Asset Intelligence app — see
// docs/adr/0022-app-switcher-multi-app-shell.md.
export default function AssetIntelligenceRootPage() {
  redirect("/asset-intelligence/mission-control");
}
