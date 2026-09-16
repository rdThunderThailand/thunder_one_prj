import { Suspense } from "react";
import { CreatePublicationPage } from "@/features/media-workspace/publications";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CreatePublicationPage />
    </Suspense>
  );
}
