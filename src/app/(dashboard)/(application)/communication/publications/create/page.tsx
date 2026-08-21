import { Suspense } from "react";
import { CreatePublicationPage } from "@/features/communication/publications";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CreatePublicationPage />
    </Suspense>
  );
}
