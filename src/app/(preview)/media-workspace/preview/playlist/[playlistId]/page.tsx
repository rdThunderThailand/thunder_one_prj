import { FullPreviewPage } from "@/features/media-workspace/preview/FullPreviewPage";

export default async function Page({ params, searchParams }: { params: Promise<{ playlistId: string }>; searchParams: Promise<{ previewSession?: string }> }) {
  const { playlistId } = await params;
  const { previewSession } = await searchParams;
  return <FullPreviewPage id={playlistId} source="playlist" sessionName={previewSession} />;
}
