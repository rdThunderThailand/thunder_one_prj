import { Suspense } from "react";
import { LayoutsListPage } from "@/features/media-workspace/layouts/components/LayoutsListPage";

export default function TemplatesPage() {
  return <Suspense fallback={null}><LayoutsListPage /></Suspense>;
}
