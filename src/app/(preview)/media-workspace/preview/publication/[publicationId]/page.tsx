import { FullPreviewPage } from "@/features/media-workspace/preview/FullPreviewPage";

export default async function Page({ params, searchParams }: { params: Promise<{ publicationId: string }>; searchParams: Promise<{ previewSession?: string }> }) {
  const { publicationId } = await params;
  const { previewSession } = await searchParams;
  return <FullPreviewPage id={publicationId} source="publication" sessionName={previewSession} />;
}
