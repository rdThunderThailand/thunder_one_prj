import { Suspense } from "react";
import { CompositionEditorPage } from "@/features/media-workspace/compositions/components/CompositionEditorPage";

export default async function Page({ params }: { params: Promise<{ layoutId: string }> }) {
  const { layoutId } = await params;
  return (
    <Suspense fallback={null}>
      <CompositionEditorPage compositionId={layoutId} />
    </Suspense>
  );
}
