import {
  CheckCircleIcon,
  FileTextIcon,
  WarningTriangleIcon,
  XCircleIcon,
} from "@/components/ui/icons";
import { formatCount } from "../../domain/asset-import-format";
import type { ImportBatch } from "../../domain/asset-import-types";

type ValidationCounts = {
  total: number;
  valid: number;
  warning: number;
  error: number;
};

type Props =
  | { variant: "validation"; counts: ValidationCounts; review?: boolean }
  | { variant: "result"; batch: ImportBatch };

export function BulkImportCounts(props: Props) {
  const result = props.variant === "result";
  const counts = result ? props.batch.counts : props.counts;
  const total = result ? props.batch.totalRows : props.counts.total;
  const review = props.variant === "validation" && props.review;
  const items = result
    ? [
        {
          label: "Assets Created",
          value:
            props.batch.counts.created + props.batch.counts.createdWithWarning,
          hint: `✓ ${formatCount(props.batch.counts.created)} ready + ${formatCount(props.batch.counts.createdWithWarning)} with warnings`,
          icon: CheckCircleIcon,
          tone: "bg-success-muted text-success",
        },
        {
          label: "Created with Warnings",
          value: props.batch.counts.createdWithWarning,
          hint: "Asset created but has warnings. Please review the details.",
          icon: WarningTriangleIcon,
          tone: "bg-warning-muted text-warning",
        },
        {
          label: "Not Registered",
          value: props.batch.counts.notRegistered,
          hint: "Rows were skipped because of errors.",
          icon: XCircleIcon,
          tone: "bg-error-muted text-error",
        },
        {
          label: "Total Rows",
          value: total,
          hint: "From your file",
          icon: FileTextIcon,
          tone: "bg-info-muted text-info",
        },
      ]
    : [
        {
          label: "Total Rows",
          value: total,
          hint: "",
          icon: FileTextIcon,
          tone: "bg-info-muted text-info",
        },
        {
          label: review ? "Ready to Register" : "Valid",
          value: counts.valid,
          hint: review ? "Will be created" : "",
          icon: CheckCircleIcon,
          tone: "bg-success-muted text-success",
        },
        {
          label: "Warnings",
          value: counts.warning,
          hint: review ? "Created only if you approve them" : "",
          icon: WarningTriangleIcon,
          tone: "bg-warning-muted text-warning",
        },
        {
          label: "Errors",
          value: counts.error,
          hint: review ? "Will not be created" : "",
          icon: XCircleIcon,
          tone: "bg-error-muted text-error",
        },
      ];

  return (
    <div
      className={`grid shrink-0 grid-cols-2 gap-3 ${
        review
          ? "@min-2xl/summary:grid-cols-4"
          : props.variant === "validation"
            ? "@min-lg/validate:grid-cols-4"
            : "xl:grid-cols-4"
      }`}
    >
      {items.map(({ label, value, hint, icon: Icon, tone }) => (
        <div
          key={label}
          className="flex min-w-0 items-start gap-2 rounded-control border border-border p-3"
        >
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-full ${tone}`}
          >
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-lg font-bold tabular-nums">{formatCount(value)}</p>
            <p className="text-2xs font-semibold">{label}</p>
            {hint && (
              <p className="mt-1 text-2xs text-muted-foreground">{hint}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
