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
    <Card className="border-warning/30 p-4">
      <p className="text-sm text-warning">{message}</p>
      <Button className="mt-2" variant="secondary" onClick={onReload}>
        โหลดใหม่
      </Button>
    </Card>
  );
}
