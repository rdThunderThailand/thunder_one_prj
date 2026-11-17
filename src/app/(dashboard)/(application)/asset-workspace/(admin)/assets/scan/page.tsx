import { redirect } from "next/navigation";

export default function ScanAssetPage() {
  redirect("/asset-workspace/assets?scan=1");
}
