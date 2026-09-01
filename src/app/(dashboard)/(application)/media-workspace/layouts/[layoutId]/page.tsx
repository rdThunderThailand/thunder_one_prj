import { Suspense } from "react";
import { CompositionEditorPage } from "@/features/media-workspace/compositions/components/CompositionEditorPage";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ layoutId: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { layoutId } = await params;
  const { preview } = await searchParams;
  return (
    <Suspense fallback={null}>
      <CompositionEditorPage compositionId={layoutId} initialPreview={preview === "1"} />
    </Suspense>
  );
}
