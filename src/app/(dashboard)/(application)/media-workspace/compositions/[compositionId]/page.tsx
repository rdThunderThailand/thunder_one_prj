import { Suspense } from "react";
import { CompositionEditorPage } from "@/features/media-workspace/compositions/components/CompositionEditorPage";

export default async function Page({ params }: { params: Promise<{ compositionId: string }> }) {
  const { compositionId } = await params;
  return (
    <Suspense fallback={null}>
      <CompositionEditorPage compositionId={compositionId} />
    </Suspense>
  );
}
