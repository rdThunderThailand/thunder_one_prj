"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { PublishFix } from "../publish-cause-fix";

/** ADR 0114 §5: the button a refused publish offers — a step jump, or a link opened in a new tab. */
export function PublishErrorFix({ fix, onStep }: { fix: PublishFix | null; onStep: (step: 1 | 2 | 3) => void }) {
  if (!fix) return null;
  if (fix.kind === "step") {
    return (
      <Button
        variant="outline"
        className="px-2.5 py-1 text-xs"
        onClick={() => onStep(fix.step)}
      >
        {fix.label}
      </Button>
    );
  }
  return (
    <Link
      href={fix.href}
      target="_blank"
      rel="noreferrer"
      className="text-xs font-medium text-primary underline"
    >
      {fix.label}
    </Link>
  );
}
