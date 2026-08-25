import { Suspense } from "react";
import { LayoutEditorPage } from "@/features/media-workspace/layouts/components/LayoutEditorPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LayoutEditorPage />
    </Suspense>
  );
}
