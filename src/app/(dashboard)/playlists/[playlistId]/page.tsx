import { PlaylistDetailPage } from "@/features/playlists";

export default async function Page({ params }: { params: Promise<{ playlistId: string }> }) {
  const { playlistId } = await params;
  return <PlaylistDetailPage playlistId={playlistId} />;
}
