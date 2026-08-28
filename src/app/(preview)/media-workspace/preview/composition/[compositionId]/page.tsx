import { FullPreviewPage } from "@/features/media-workspace/preview/FullPreviewPage";

export default async function Page({ params, searchParams }: { params: Promise<{ compositionId: string }>; searchParams: Promise<{ previewSession?: string }> }) {
  const { compositionId } = await params;
  const { previewSession } = await searchParams;
  return <FullPreviewPage id={compositionId} source="composition" sessionName={previewSession} />;
}
