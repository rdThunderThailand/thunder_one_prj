import { Suspense } from "react";
import { CompositionEditorPage } from "@/features/media-workspace/compositions/components/CompositionEditorPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CompositionEditorPage />
    </Suspense>
  );
}
