import { Suspense } from "react";
import { PlaylistsListPage } from "@/features/media-workspace/playlists/components/PlaylistsListPage";

export default function PlaylistsPage() {
  return (
    <Suspense fallback={null}>
      <PlaylistsListPage />
    </Suspense>
  );
}
