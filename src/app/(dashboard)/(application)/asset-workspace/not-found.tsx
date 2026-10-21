import Link from "next/link";
import { buttonVariants } from "@/components/ui/lovable/button";
import { NotFoundState } from "@/features/asset-workspace/components/states/states";

export default function AssetWorkspaceNotFound() {
  return (
    <div className="p-6">
      <NotFoundState
        action={
          <Link
            href="/asset-workspace"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Back to Overview
          </Link>
        }
      />
    </div>
  );
}
