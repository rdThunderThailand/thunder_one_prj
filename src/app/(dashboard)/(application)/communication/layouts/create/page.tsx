import { Suspense } from "react";
import { LayoutEditorPage } from "@/features/communication/layouts/components/LayoutEditorPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LayoutEditorPage />
    </Suspense>
  );
}
