"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  BookIcon,
  CategoryIcon,
  ChevronRightIcon,
  FileTextIcon,
  SpinnerIcon,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import type { ImportOptions } from "../../domain/asset-import-types";
import { useAssetImportTemplate } from "../../hooks/use-asset-import-template";

interface RegistrationResourcesProps {
  options: ImportOptions | null;
  loading?: boolean;
  tenantId: string;
  userId: string;
}

export function RegistrationResources({
  options,
  loading = false,
  tenantId,
  userId,
}: RegistrationResourcesProps) {
  const { downloading, downloadTemplate } = useAssetImportTemplate(options, { tenantId, userId });
  const templateEnabled = Boolean(options?.ready) && !loading && !downloading;

  return (
    <section
      aria-labelledby="registration-resources-title"
      className="min-w-0 space-y-2 rounded-card border border-border bg-card p-3"
    >
      <h2
        id="registration-resources-title"
        className="text-sm font-semibold"
      >
        Related resources
      </h2>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-control border border-border p-3">
          <Button
            variant="ghost"
            disabled={!templateEnabled}
            onClick={() => void downloadTemplate()}
            aria-busy={downloading}
            aria-describedby={
              !options?.ready ? "registration-template-unavailable" : undefined
            }
            className={resourceClassName}
          >
            <ResourceContent
              label={downloading ? "Preparing template…" : "Download Template"}
              description="Get the Excel template for bulk asset registration"
              icon={
                downloading ? (
                  <SpinnerIcon className="h-6 w-6 animate-spin motion-reduce:animate-none" />
                ) : (
                  <FileTextIcon className="h-6 w-6" />
                )
              }
            />
          </Button>
          {!options?.ready && (
            <p
              id="registration-template-unavailable"
              className="mt-2 text-2xs text-muted-foreground"
            >
              Available when bulk import is enabled
            </p>
          )}
        </div>
        <div className="rounded-control border border-border p-3">
          <Button
            variant="ghost"
            disabled
            className={resourceClassName}
          >
            <ResourceContent
              label="View Import Guide"
              description="Step-by-step guide for file import"
              icon={<BookIcon className="h-6 w-6" />}
            />
          </Button>
        </div>
        <div className="rounded-control border border-border p-3">
          {!loading ? (
            <Button
              asChild
              variant="ghost"
              className={resourceClassName}
            >
              <Link href="/asset-workspace/categories">
                <ResourceContent
                  label="View Asset Categories"
                  description="Check available categories and required fields"
                  icon={<CategoryIcon className="h-6 w-6" />}
                />
              </Link>
            </Button>
          ) : (
            <Button
              variant="ghost"
              disabled
              className={resourceClassName}
            >
              <ResourceContent
                label="View Asset Categories"
                description="Check available categories and required fields"
                icon={<CategoryIcon className="h-6 w-6" />}
              />
            </Button>
          )}
        </div>
      </div>
      {!loading && !options && (
        <p role="status" className="text-xs text-muted-foreground">
          Could not load bulk import settings. Use Retry on the Bulk Assets card.
        </p>
      )}
    </section>
  );
}

const resourceClassName =
  "h-auto min-h-10 w-full justify-start gap-3 whitespace-normal p-0 text-left";

function ResourceContent({
  icon,
  label,
  description,
}: {
  icon: ReactNode;
  label: string;
  description: string;
}) {
  return (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info-muted text-primary">
        {icon}
      </span>
      <span className="min-w-0 flex-1 space-y-1">
        <span className="block text-xs font-semibold text-primary">
          {label}
        </span>
        <span className="block text-xs font-normal text-muted-foreground">
          {description}
        </span>
      </span>
      <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
    </>
  );
}
