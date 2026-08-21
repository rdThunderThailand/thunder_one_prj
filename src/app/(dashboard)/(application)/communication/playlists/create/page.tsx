import { Suspense } from "react";
import { CreatePlaylistPage } from "@/features/communication/playlists/components/CreatePlaylistPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CreatePlaylistPage />
    </Suspense>
  );
}
