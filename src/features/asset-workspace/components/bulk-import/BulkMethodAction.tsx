"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Skeleton } from "@/components/ui/lovable/skeleton";
import { formatBytes, formatCount } from "../../domain/asset-import-format";
import type { ImportOptions } from "../../domain/asset-import-types";
import { useAssetImportOptions } from "../../hooks/use-asset-import-options";

interface BulkMethodActionProps {
  tenantId: string;
  userId: string;
  onOptionsChange?: (options: ImportOptions | null, loading: boolean) => void;
}

export function BulkMethodAction({
  tenantId,
  userId,
  onOptionsChange,
}: BulkMethodActionProps) {
  const { options, loading, error, reload } = useAssetImportOptions({
    tenantId,
    userId,
  });

  useEffect(() => {
    onOptionsChange?.(loading || error ? null : options, loading);
  }, [options, loading, error, onOptionsChange]);

  if (loading) {
    return (
      <Skeleton
        aria-label="Loading bulk import settings"
        className="mt-auto h-8 w-full"
      />
    );
  }

  if (options?.ready && !error) {
    return (
      <div className="mt-auto space-y-1">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Link href="/asset-workspace/assets/import">
            Register Bulk Assets
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </Button>
        <p className="text-2xs text-muted-foreground tabular-nums">
          XLSX or CSV · up to {formatBytes(options.file.maxBytes)} · up to{" "}
          {formatCount(options.file.maxRows)} rows
        </p>
      </div>
    );
  }

  const message =
    error?.status === 403
      ? "You do not have permission to import assets."
      : error
        ? "Could not load bulk import settings."
        : "Bulk registration is not available yet.";

  return (
    <div className="mt-auto space-y-1">
      <Button
        variant="outline"
        size="sm"
        disabled
        aria-describedby="bulk-registration-reason"
        className="w-full"
      >
        Register Bulk Assets
        <ArrowRightIcon className="h-4 w-4" />
      </Button>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p
          id="bulk-registration-reason"
          className="text-2xs text-muted-foreground"
        >
          {message}
        </p>
        {error && error.status !== 403 && (
          <Button
            variant="link"
            size="sm"
            onClick={reload}
            className="h-auto p-0 text-2xs"
          >
            Retry
          </Button>
        )}
        {process.env.NODE_ENV === "development" && options && !error && (
          <Button variant="link" size="sm" asChild className="h-auto p-0 text-2xs">
            <Link href="/asset-workspace/assets/import?preview=upload">
              Preview Upload File
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
