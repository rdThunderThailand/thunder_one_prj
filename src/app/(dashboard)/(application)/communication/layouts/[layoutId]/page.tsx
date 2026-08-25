import { Suspense } from "react";
import { LayoutEditorPage } from "@/features/communication/layouts/components/LayoutEditorPage";

export default async function Page({ params }: { params: Promise<{ layoutId: string }> }) {
  const { layoutId } = await params;
  return (
    <Suspense fallback={null}>
      <LayoutEditorPage layoutId={layoutId} />
    </Suspense>
  );
}
