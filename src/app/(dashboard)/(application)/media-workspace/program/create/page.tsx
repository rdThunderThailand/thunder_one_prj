import { Suspense } from "react";
import { getSession } from "@/features/auth/services/get-session";
import { CreatePublicationPage } from "@/features/media-workspace/publications";

export default async function Page() {
  const session = await getSession();
  // The layout redirects "forbidden"; the draft belongs to one person in one tenant.
  const draftOwner = session === "forbidden" ? "" : `${session.userId}:${session.tenantId}`;
  return (
    <Suspense fallback={null}>
      <CreatePublicationPage draftOwner={draftOwner} />
    </Suspense>
  );
}
