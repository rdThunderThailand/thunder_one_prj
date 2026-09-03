import { PlaylistEditorPage } from "@/features/media-workspace/playlists";

export default async function Page({ params }: { params: Promise<{ playlistId: string }> }) {
  const { playlistId } = await params;
  return <PlaylistEditorPage playlistId={playlistId} />;
}
