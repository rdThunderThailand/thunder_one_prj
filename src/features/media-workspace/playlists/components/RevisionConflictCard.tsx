"use client";

import { Button } from "@/components/ui/lovable/button";

export function RevisionConflictCard({
  message,
  onReload,
}: {
  message: string;
  onReload: () => void;
}) {
  return (
    <div className="rounded-lg border border-warning/30 bg-warning-soft p-4">
      <p className="text-sm text-warning">{message}</p>
      <Button className="mt-2" variant="outline" onClick={onReload}>
        โหลดใหม่
      </Button>
    </div>
  );
}
