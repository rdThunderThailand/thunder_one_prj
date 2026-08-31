import { Suspense } from "react";
import { LayoutEditorPage } from "@/features/media-workspace/layouts/components/LayoutEditorPage";

export default async function TemplatePage({ params }: { params: Promise<{ layoutId: string }> }) {
  const { layoutId } = await params;
  return <Suspense fallback={null}><LayoutEditorPage layoutId={layoutId} /></Suspense>;
}
