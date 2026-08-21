import { Suspense } from "react";
import { getSession } from "@/features/auth/services/get-session";
import { PlaylistsListPage } from "@/features/communication/playlists/components/PlaylistsListPage";

export default async function PlaylistsPage() {
  const session = await getSession();
  const currentUserId = session === "forbidden" ? null : session.userId;

  return (
    <Suspense fallback={null}>
      <PlaylistsListPage currentUserId={currentUserId} />
    </Suspense>
  );
}
