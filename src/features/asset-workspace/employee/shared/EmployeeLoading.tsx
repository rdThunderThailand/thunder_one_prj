// Route loading screens for the employee pages that are not lists. Each copies its page's frame (padding, grid,
// cards, real titles) so the page swaps in without a jump; only the data is a skeleton. The lists use
// `EmployeeListPage loading` instead.
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

function Loading({ label, className, children }: { label: string; className: string; children: ReactNode }) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`${className} motion-reduce:[&_.animate-pulse]:animate-none`}
    >
      {children}
    </div>
  );
}

function BackLink() {
  return <Skeleton className="h-5 w-24" />;
}

function SectionCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <Card className="space-y-3 p-4 sm:p-5">
      {title ? <h2 className="text-base font-semibold text-foreground">{title}</h2> : <Skeleton className="h-5 w-32" />}
      {children}
    </Card>
  );
}

function Lines({ count, className = "h-4" }: { count: number; className?: string }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton
          key={index}
          className={`${className} ${index % 2 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

/** Home: header with Scan Asset, 3 tiles, the task list and 4 asset picture cards. */
export function MyHomeLoading() {
  return (
    <Loading
      label="Loading home"
      className="space-y-4 p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-9 w-32 rounded-control" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((tile) => (
          <Card
            key={tile}
            className="flex items-start gap-3 p-4"
          >
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-12" />
              <Skeleton className="h-3 w-14" />
            </div>
          </Card>
        ))}
      </div>
      <SectionCard title="Tasks to do">
        <div className="divide-y divide-border">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-48 max-w-full" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-2 w-full sm:w-44" />
              <Skeleton className="h-3 w-20 sm:w-28" />
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="My latest assets">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((card) => (
            <div
              key={card}
              className="space-y-2 rounded-lg border border-border p-3"
            >
              <Skeleton className="aspect-4/3 w-full rounded-md" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </SectionCard>
    </Loading>
  );
}

/** Asset view: hero (photo + 4 facts), Details, and the Held by / Warranty / help rail. */
export function MyAssetLoading() {
  return (
    <Loading
      label="Loading asset"
      className="@container/my-asset space-y-4 p-4 sm:p-6"
    >
      <BackLink />
      <div className="grid min-w-0 items-start gap-4 @min-5xl/my-asset:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-4">
          <Card className="@container/my-asset-hero min-w-0 p-4 sm:p-5">
            <div className="grid min-w-0 items-start gap-4 @min-xl/my-asset-hero:grid-cols-[10rem_minmax(0,1fr)]">
              <Skeleton className="h-40 w-full rounded-md @min-xl/my-asset-hero:w-40" />
              <div className="min-w-0 space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-7 w-64 max-w-full" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-4 @min-2xl/my-asset-hero:grid-cols-4">
                  {[0, 1, 2, 3].map((fact) => (
                    <div
                      key={fact}
                      className="space-y-1.5"
                    >
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-24 max-w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
          <SectionCard title="Details">
            <div className="space-y-4">
              {[0, 1, 2, 3].map((fact) => (
                <div
                  key={fact}
                  className="flex gap-3"
                >
                  <Skeleton className="size-4 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
        <div className="grid min-w-0 gap-4 @min-2xl/my-asset:grid-cols-2 @min-5xl/my-asset:grid-cols-1">
          <SectionCard title="Held by">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-3 w-44" />
          </SectionCard>
          <SectionCard title="Warranty">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-2 w-full" />
            <Lines count={3} />
          </SectionCard>
          <Card className="space-y-2 p-4">
            <Skeleton className="h-4 w-48 max-w-full" />
            <Skeleton className="h-3 w-full" />
          </Card>
        </div>
      </div>
    </Loading>
  );
}

/** Task page: header, status/progress strip, the assets-to-check table and My Findings. */
export function MyTaskLoading() {
  return (
    <Loading
      label="Loading task"
      className="space-y-4 p-4 sm:p-6"
    >
      <BackLink />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56 max-w-full" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-9 w-40 rounded-control" />
      </div>
      <Card className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <div className="flex min-w-48 flex-1 items-center gap-2">
          <Skeleton className="h-4 w-24 shrink-0" />
          <Skeleton className="h-2 flex-1" />
        </div>
      </Card>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-64 max-w-full rounded-control" />
          <Skeleton className="h-9 w-36 rounded-control" />
        </div>
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3">
            <Skeleton className="h-3 w-1/3" />
          </div>
          {[0, 1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0"
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-48 max-w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="hidden h-4 w-24 md:block" />
              <Skeleton className="h-8 w-16 rounded-control" />
            </div>
          ))}
        </Card>
      </div>
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">My Findings</h2>
        <Card className="p-4">
          <Skeleton className="h-4 w-2/3" />
        </Card>
      </section>
    </Loading>
  );
}

/** Scan Asset: the real header, the scan card and the "How scanning works" rail. */
export function MyScanLoading() {
  return (
    <Loading
      label="Loading scanner"
      className="space-y-4 p-4 sm:p-6"
    >
      <PageHeader
        title="Scan Asset"
        subtitle="Scan a QR code or enter an identifier to open one of your assets."
      />
      <div className="grid max-w-4xl items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card className="space-y-4 p-4 sm:p-6">
          <Skeleton className="h-9 w-full rounded-control" />
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="mx-auto h-3 w-64 max-w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-control" />
          </div>
        </Card>
        <SectionCard title="How scanning works">
          <div className="space-y-4">
            {[0, 1, 2].map((tip) => (
              <div
                key={tip}
                className="flex gap-3"
              >
                <Skeleton className="size-9 shrink-0 rounded-control" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-9 w-full rounded-control" />
        </SectionCard>
      </div>
    </Loading>
  );
}
