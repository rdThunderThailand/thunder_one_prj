import { getSession } from "@/features/auth/services/get-session";
import { PlaylistsListPage } from "@/features/playlists/components/PlaylistsListPage";

export default async function PlaylistsPage() {
  // The "My Playlists" tab needs the caller's user id, and the layout's own getSession()
  // call has no way down to a client component — one extra bootstrap call beats threading
  // a context provider through the whole shell. "forbidden" is already handled by the layout.
  const session = await getSession();
  const currentUserId = session === "forbidden" ? null : session.userId;

  return <PlaylistsListPage currentUserId={currentUserId} />;
}
