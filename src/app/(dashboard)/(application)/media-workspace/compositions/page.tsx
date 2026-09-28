import { redirect } from "next/navigation";

// Normally never reached: next.config.ts `redirects()` handles this path
// before rendering. Kept as a fallback.
export default function CompositionsPage() {
  redirect("/media-workspace/layouts");
}
