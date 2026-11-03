import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  MonitorIcon, CheckIcon, CheckCircleIcon, ArrowRightIcon, ChevronRightIcon,
  FileTextIcon, BookIcon, CategoryIcon, InfoIcon, PlusIcon, UploadIcon,
  TransferIcon, ClipboardIcon, ClockIcon, UserIcon,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";

const methods = [
  {
    title: "Single Asset", icon: MonitorIcon, badge: PlusIcon, available: true,
    description: "Register one asset with detailed information",
    features: ["Fill in asset information step by step", "Set location, custody, warranty and more", "Suitable for new or unique assets"],
  },
  {
    title: "Bulk Assets", icon: FileTextIcon, badge: UploadIcon, available: false,
    description: "Register multiple assets using file import or template",
    features: ["Upload an Excel or CSV file", "Use a template with required fields", "Validate before creating assets", "Suitable for bulk registration or similar assets"],
  },
];

const comparisons = [
  { label: "Use case", icon: TransferIcon, single: "One asset at a time", bulk: "Multiple assets at once" },
  { label: "Data input", icon: UploadIcon, single: "Form with full details", bulk: "Excel / CSV file import" },
  { label: "Recommended for", icon: UserIcon, single: "New assets with unique details", bulk: "Many similar assets" },
  { label: "Required information", icon: ClipboardIcon, single: "All mandatory fields", bulk: "Template with required fields" },
  { label: "Time to complete", icon: ClockIcon, single: "Approximately 2–3 minutes per asset", bulk: "A few minutes for file upload" },
];

const resources = [
  { label: "Download Template", icon: FileTextIcon, description: "Get Excel template for bulk asset registration" },
  { label: "View Import Guide", icon: BookIcon, description: "Step-by-step guide for file import" },
  { label: "View Asset Categories", icon: CategoryIcon, description: "Check available categories and required fields" },
];

export function RegistrationMethodChoice() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div data-registration-scroll className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pb-4 pr-1">
        <div className="grid items-start gap-3 lg:grid-cols-[3fr_2fr]">
          <PageHeader title="Register Asset" subtitle="Choose how you want to register assets" />
          <div className="flex items-start gap-3 rounded-control bg-info-muted p-3 text-info">
            <InfoIcon className="mt-1 h-4 w-4" />
            <div className="space-y-1 text-xs">
              <p className="font-semibold">Select the option that matches your situation</p>
              <p>Single registration is available for preparation and review. Saving new assets and bulk registration are not available yet.</p>
            </div>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {methods.map(({ title, icon: Icon, badge: Badge, description, features, available }) => (
            <section key={title} aria-label={title} className={`relative grid gap-4 rounded-card border bg-card p-4 sm:grid-cols-[auto_1fr] ${available ? "border-primary" : "border-border"}`}>
              <span aria-hidden className="absolute right-3 top-3">
                {available ? (
                  <CheckCircleIcon className="h-4 w-4 text-primary" />
                ) : (
                  <span className="block h-4 w-4 rounded-full border border-border" />
                )}
              </span>
              <div className={`relative flex h-24 w-24 items-center justify-center rounded-full lg:h-28 lg:w-28 ${available ? "bg-info-muted text-primary" : "bg-success-muted text-success"}`}>
                <Icon className="h-12 w-12 lg:h-16 lg:w-16" />
                <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground">
                  <Badge className="h-4 w-4" />
                </span>
              </div>
              <div className="flex min-w-0 flex-col gap-3">
                <div className="pr-4">
                  <h2 className="text-sm font-bold">{title}</h2>
                  <p className="mt-1 max-w-64 text-xs text-muted-foreground">{description}</p>
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className={`mt-0.5 flex h-3 w-3 shrink-0 items-center justify-center rounded-full ${available ? "bg-primary text-primary-foreground" : "bg-success text-success-foreground"}`}>
                        <CheckIcon className="h-2 w-2" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                {available ? (
                  <Button asChild size="sm" className="mt-auto w-full">
                    <Link href="/asset-workspace/assets/register?mode=single">
                      Register Single Asset
                      <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <div className="mt-auto space-y-1">
                    <Button variant="outline" size="sm" disabled aria-describedby="bulk-registration-reason" className="w-full">
                      Register Bulk Assets
                      <ArrowRightIcon className="h-4 w-4" />
                    </Button>
                    <p id="bulk-registration-reason" className="text-2xs text-muted-foreground">Bulk registration is not available in this version.</p>
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
        <section aria-labelledby="method-comparison-title" className="space-y-2 rounded-card border border-border bg-card p-3">
          <h2 id="method-comparison-title" className="text-sm font-semibold">Method comparison</h2>
          <div className="overflow-hidden rounded-control border border-border">
            <div className="hidden grid-cols-[1fr_1.5fr_1.5fr] bg-muted text-xs font-semibold sm:grid" aria-hidden>
              <span className="px-3 py-2">Feature</span>
              <span className="flex items-center gap-2 bg-info-muted px-3 py-2">
                <MonitorIcon className="h-4 w-4 text-primary" />
                Single Asset
              </span>
              <span className="flex items-center gap-2 px-3 py-2">
                <FileTextIcon className="h-4 w-4 text-success" />
                Bulk Assets
              </span>
            </div>
            <dl className="divide-y divide-border text-xs">
              {comparisons.map(({ label, icon: Icon, single, bulk }) => (
                <div key={label} className="grid gap-1 p-3 sm:grid-cols-[1fr_1.5fr_1.5fr] sm:gap-0 sm:p-0">
                  <dt className="flex items-center gap-3 font-semibold sm:px-3 sm:py-1">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {label}
                  </dt>
                  <dd className="text-muted-foreground sm:px-3 sm:py-1">
                    <span className="sm:sr-only">Single Asset: </span>
                    {single}
                  </dd>
                  <dd className="text-muted-foreground sm:px-3 sm:py-1">
                    <span className="sm:sr-only">Bulk Assets: </span>
                    {bulk}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
        <section aria-labelledby="registration-resources-title" className="space-y-2 rounded-card border border-border bg-card p-3">
          <h2 id="registration-resources-title" className="text-sm font-semibold">Related resources</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {resources.map(({ label, icon: Icon, description }, index) => (
              <div key={label} className="rounded-control border border-border p-3">
                <Button variant="ghost" disabled aria-describedby={`registration-resource-${index}`} className="h-auto w-full justify-start gap-3 whitespace-normal p-0 text-left disabled:opacity-100">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info-muted text-primary">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="block text-xs font-semibold text-primary">{label}</span>
                    <span className="block text-xs font-normal text-muted-foreground">{description}</span>
                  </span>
                  <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                </Button>
                <p id={`registration-resource-${index}`} className="mt-2 text-2xs text-muted-foreground">Not available in this version.</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <footer data-registration-footer className="shrink-0 border-t border-border bg-card px-3 py-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/asset-workspace/assets">Cancel</Link>
        </Button>
      </footer>
    </div>
  );
}
