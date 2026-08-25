import { Suspense } from "react";
import { CreatePlaylistPage } from "@/features/media-workspace/playlists/components/CreatePlaylistPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CreatePlaylistPage />
    </Suspense>
  );
}
