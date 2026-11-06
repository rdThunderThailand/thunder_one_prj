import { redirect } from "next/navigation";

// Reports opens on its first tab (05 §4.13.5); each tab is its own route.
export default function ReportsPage() {
  redirect("/asset-workspace/reports/summary");
}
