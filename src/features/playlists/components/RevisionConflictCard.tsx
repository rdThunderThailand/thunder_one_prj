"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function RevisionConflictCard({
  message,
  onReload,
}: {
  message: string;
  onReload: () => void;
}) {
  return (
    <Card className="border-amber-200 p-4 dark:border-amber-900">
      <p className="text-sm text-amber-700 dark:text-amber-400">{message}</p>
      <Button className="mt-2" variant="secondary" onClick={onReload}>
        โหลดใหม่
      </Button>
    </Card>
  );
}
