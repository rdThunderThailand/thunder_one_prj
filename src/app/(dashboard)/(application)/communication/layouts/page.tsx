import { Suspense } from "react";
import { LayoutsListPage } from "@/features/communication/layouts/components/LayoutsListPage";

export default function LayoutsPage() {
  return (
    <Suspense fallback={null}>
      <LayoutsListPage />
    </Suspense>
  );
}
