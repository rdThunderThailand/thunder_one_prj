import Link from "next/link";
import { Button } from "@/components/ui/lovable/button";
import { PlusIcon } from "@/components/ui/icons";
import type { CategoryStatus } from "../../domain/asset-category";
import { categoryRegistrationHref } from "../../domain/category-detail";

export function CategoryRegistrationButton({ id, status, busy }: { id: string; status: CategoryStatus; busy: boolean }) {
  if (busy || status !== "Active") {
    return (
      <span title={busy ? "Wait for the category to finish loading or updating." : "Activate this category before registering an asset."}>
        <Button disabled size="sm" className="max-sm:h-10"
          aria-description={busy ? "Wait for the category to finish loading or updating." : "Activate this category before registering an asset."}>
          <PlusIcon aria-hidden="true" className="size-4" />
          Register Asset
        </Button>
      </span>
    );
  }
  return (
    <Button asChild size="sm" className="max-sm:h-10">
      <Link href={categoryRegistrationHref(id)}>
        <PlusIcon aria-hidden="true" className="size-4" />
        Register Asset
      </Link>
    </Button>
  );
}
