import { redirect } from "next/navigation";

// Normally never reached: next.config.ts `redirects()` handles this path
// before rendering. Kept as a fallback.
// Technician is the landing persona for the ThunderCare app (Work Orders
// before Service Ops, matching persona order in the requirement doc) — see
// docs/adr/0033-thunder-one-shell-launcher-not-dropdown.md.
export default function ThunderCareRootPage() {
  redirect("/thunder-care/work-orders");
}
