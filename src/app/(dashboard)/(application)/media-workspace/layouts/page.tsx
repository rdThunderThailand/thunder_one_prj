import { Suspense } from "react";
import { CompositionsListPage } from "@/features/media-workspace/compositions/components/CompositionsListPage";

export default function LayoutsPage() {
  return (
    <Suspense fallback={null}>
      <CompositionsListPage />
    </Suspense>
  );
}
