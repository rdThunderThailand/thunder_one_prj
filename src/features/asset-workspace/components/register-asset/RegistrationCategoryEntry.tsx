"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/lovable/button";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { loadRegistrationCategory } from "../../services/registration-category-prefill";
import { RegistrationLoading } from "./RegistrationLoading";
import { SingleAssetWizard } from "./SingleAssetWizard";

export function RegistrationCategoryEntry({ tenantId, userId, categoryId, options }: {
  tenantId: string; userId: string; categoryId: string | string[]; options: RegistrationOptions;
}) {
  const [attempt, setAttempt] = useState(0);
  const [snapshot, setSnapshot] = useState<{ attempt: number; result: Awaited<ReturnType<typeof loadRegistrationCategory>> } | null>(null);
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    void loadRegistrationCategory(`${tenantId}:${userId}`, categoryId, controller.signal).then((result) => {
      if (alive) setSnapshot({ attempt, result });
    }).catch(() => { /* Abort only: the service converts request failures to safe results. */ });
    return () => { alive = false; controller.abort(); };
  }, [tenantId, userId, categoryId, attempt]);
  if (!snapshot || snapshot.attempt !== attempt) return <RegistrationLoading />;
  if (snapshot.result.ok) {
    return <SingleAssetWizard tenantId={tenantId} userId={userId} options={options} initialCategory={snapshot.result.category} />;
  }
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-y-auto p-1">
      <Card role="alert" className="space-y-4 p-4 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none">
        <h1 className="text-xl font-extrabold">Category unavailable for registration</h1>
        <p className="text-sm text-muted-foreground">{snapshot.result.message}</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/asset-workspace/assets/register?mode=single">Continue to Single Registration</Link>
          </Button>
          <Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>Retry category</Button>
          <Button asChild variant="ghost">
            <Link href="/asset-workspace/categories">Back to Categories</Link>
          </Button>
          {snapshot.result.status === 401 && (
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
