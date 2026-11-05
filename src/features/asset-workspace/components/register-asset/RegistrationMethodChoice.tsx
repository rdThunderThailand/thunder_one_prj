"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  MonitorIcon,
  ArrowRightIcon,
  FileTextIcon,
  InfoIcon,
  UploadIcon,
  TransferIcon,
  ClipboardIcon,
  ClockIcon,
  UserIcon,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { cn } from "@/lib/utils";
import type { ImportOptions } from "../../domain/asset-import-types";
import { BulkMethodAction } from "../bulk-import/BulkMethodAction";
import { RegistrationBreadcrumb } from "./RegistrationBreadcrumb";
import { RegistrationMethodCard, type RegistrationMethod } from "./RegistrationMethodCard";
import { RegistrationResources } from "./RegistrationResources";

const comparisons = [
  {
    label: "Use case",
    icon: TransferIcon,
    single: "One asset at a time",
    bulk: "Multiple assets at once",
  },
  {
    label: "Data input",
    icon: UploadIcon,
    single: "Form with full details",
    bulk: "Excel / CSV file import",
  },
  {
    label: "Recommended for",
    icon: UserIcon,
    single: "New assets with unique details",
    bulk: "Many similar assets",
  },
  {
    label: "Required information",
    icon: ClipboardIcon,
    single: "All mandatory fields",
    bulk: "Template file with required fields",
  },
  {
    label: "Time to complete",
    icon: ClockIcon,
    single: "Approximately 2–3 minutes per asset",
    bulk: "A few minutes for file upload",
  },
];

export function RegistrationMethodChoice({
  tenantId,
  userId,
}: {
  tenantId: string;
  userId: string;
}) {
  const [method, setMethod] = useState<RegistrationMethod>("single");
  const [bulkState, setBulkState] = useState<{
    options: ImportOptions | null;
    loading: boolean;
  }>({
    options: null,
    loading: true,
  });

  const handleOptionsChange = useCallback(
    (options: ImportOptions | null, loading: boolean) => {
      setBulkState({ options, loading });
    },
    [],
  );

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-3">
      <div
        data-registration-scroll
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pb-4 pr-1"
      >
        <RegistrationBreadcrumb />
        <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <PageHeader
            title="Register Asset"
            subtitle="Choose how you want to register assets"
          />
          <div className="flex items-start gap-3 rounded-control bg-info-muted p-3 text-info">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 space-y-1 text-xs">
              <p className="font-semibold text-foreground">
                Select the option that matches your situation
              </p>
              <p className="text-muted-foreground">
                {bulkState.options?.ready
                  ? "Register one asset with full details, or many assets with a file import."
                  : bulkState.loading
                    ? "Choose how you want to register assets."
                    : bulkState.options
                      ? "Register one asset with full details. Bulk registration is not available yet."
                      : "Register one asset with full details. Bulk import settings could not be loaded."}
              </p>
            </div>
          </div>
        </div>
        <div
          role="radiogroup"
          aria-label="Registration method"
          className="grid gap-3 lg:grid-cols-2"
        >
          <RegistrationMethodCard
            method="single"
            selected={method === "single"}
            onSelect={() => setMethod("single")}
          >
            <Button
              asChild
              size="sm"
              variant={method === "single" ? "default" : "outline"}
              className="mt-auto w-full"
            >
              <Link href="/asset-workspace/assets/register?mode=single">
                Register Single Asset
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </Button>
          </RegistrationMethodCard>
          <RegistrationMethodCard
            method="bulk"
            selected={method === "bulk"}
            onSelect={() => setMethod("bulk")}
          >
            <BulkMethodAction
              tenantId={tenantId}
              userId={userId}
              selected={method === "bulk"}
              onOptionsChange={handleOptionsChange}
            />
          </RegistrationMethodCard>
        </div>
        <section
          aria-labelledby="method-comparison-title"
          className="space-y-2 rounded-card border border-border bg-card p-3"
        >
          <h2
            id="method-comparison-title"
            className="text-sm font-semibold"
          >
            Method Comparison
          </h2>
          <div className="overflow-hidden rounded-control border border-border">
            <div
              className="hidden grid-cols-[1fr_1.5fr_1.5fr] bg-muted text-xs font-semibold sm:grid"
              aria-hidden
            >
              <span className="px-3 py-2">Feature</span>
              <span className={cn("flex items-center gap-2 px-3 py-2", method === "single" && "bg-info-muted")}>
                <MonitorIcon className="h-4 w-4 text-primary" />
                Single Asset
              </span>
              <span className={cn("flex items-center gap-2 px-3 py-2", method === "bulk" && "bg-info-muted")}>
                <FileTextIcon className="h-4 w-4 text-success" />
                Bulk Assets
              </span>
            </div>
            <dl className="divide-y divide-border text-xs tabular-nums">
              {comparisons.map(({ label, icon: Icon, single, bulk }) => (
                <div
                  key={label}
                  className="grid gap-1 p-3 sm:grid-cols-[1fr_1.5fr_1.5fr] sm:gap-0 sm:p-0"
                >
                  <dt className="flex items-center gap-3 font-semibold sm:px-3 sm:py-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {label}
                  </dt>
                  <dd className="text-muted-foreground sm:px-3 sm:py-2">
                    <span className="sm:sr-only">Single Asset: </span>
                    {single}
                  </dd>
                  <dd className="text-muted-foreground sm:px-3 sm:py-2">
                    <span className="sm:sr-only">Bulk Assets: </span>
                    {bulk}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
        <RegistrationResources
          options={bulkState.options}
          loading={bulkState.loading}
          tenantId={tenantId}
          userId={userId}
        />
      </div>
      <footer
        data-registration-footer
        className="shrink-0 border-t border-border bg-card px-3 py-3"
      >
        <Button
          asChild
          variant="outline"
          size="sm"
        >
          <Link href="/asset-workspace/assets">Cancel</Link>
        </Button>
      </footer>
    </div>
  );
}
