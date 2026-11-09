"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CategoryDetailLoading } from "./CategoryDetailLoading";

function CategoryTabLoading() {
  const search = useSearchParams();
  return <CategoryDetailLoading assets={search.get("tab") === "assets"} />;
}

export function CategoryDetailRouteLoading() {
  return (
    <Suspense fallback={<CategoryDetailLoading />}>
      <CategoryTabLoading />
    </Suspense>
  );
}
