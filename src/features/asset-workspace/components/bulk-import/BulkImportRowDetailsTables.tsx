import type { ReactNode } from "react";
import { CheckCircleIcon, WarningTriangleIcon, XCircleIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { RowFieldCheck } from "../../domain/asset-import-row-details";
import { ImportMessageDetails } from "./BulkImportRowMessages";

const ROW_TONE: Record<RowFieldCheck["status"], string> = {
  valid: "",
  empty: "",
  warning: "bg-warning-muted/40",
  error: "bg-error-muted/40",
};

function FieldStatus({ status }: { status: RowFieldCheck["status"] }) {
  if (status === "empty") return <span className="text-muted-foreground">Not Provided</span>;
  const Icon = status === "valid" ? CheckCircleIcon : status === "warning" ? WarningTriangleIcon : XCircleIcon;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 font-medium",
      status === "valid" ? "text-success" : status === "warning" ? "text-warning" : "text-error",
    )}>
      <Icon className="size-3.5 shrink-0" />
      {status === "valid" ? "Valid" : status === "warning" ? "Warning" : "Error"}
    </span>
  );
}

function Panel({ title, hint, headers, children }: {
  title: ReactNode;
  hint: string;
  headers: string[];
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="overflow-x-auto rounded-control border border-border">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted text-2xs text-muted-foreground">
            <tr>
              {headers.map((header) => (
                <th key={header} scope="col" className="whitespace-nowrap px-2 py-1.5 font-semibold">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">{children}</tbody>
        </table>
      </div>
    </section>
  );
}

export function BulkImportRowDetailsTables({ rowIndex, checks }: { rowIndex: number; checks: RowFieldCheck[] }) {
  return (
    <div className="grid items-start gap-4 @min-4xl/details:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Panel
        title={<>Source Data <span className="font-normal">(from your file)</span></>}
        hint={`This is the data from row ${rowIndex} in your file.`}
        headers={["Field", "Value"]}
      >
        {checks.map(({ key, label, value, status }) => (
          <tr key={key}>
            <th scope="row" className="whitespace-nowrap px-2 py-1.5 font-semibold">{label}</th>
            <td className={cn("wrap-anywhere whitespace-pre-wrap px-2 py-1.5", ROW_TONE[status])}>{value || "–"}</td>
          </tr>
        ))}
      </Panel>
      <Panel
        title="Validation Results"
        hint="Each field is checked using ThunderOne rules."
        headers={["ThunderOne Field", "Value", "Validation Result", "Message"]}
      >
        {checks.map(({ key, label, value, status, message, messages }) => (
          <tr key={key} className={ROW_TONE[status]}>
            <th scope="row" className="whitespace-nowrap px-2 py-1.5 font-semibold">{label}</th>
            <td className="wrap-anywhere whitespace-pre-wrap px-2 py-1.5">
              {value || <span className="text-muted-foreground">(empty)</span>}
            </td>
            <td className="whitespace-nowrap px-2 py-1.5"><FieldStatus status={status} /></td>
            <td className="wrap-anywhere space-y-1 px-2 py-1.5">
              <p className={cn(status === "error" && "text-error")}>{message ?? "–"}</p>
              {messages.map((item, index) => (
                <ImportMessageDetails key={`${item.code}:${index}`} message={item} />
              ))}
            </td>
          </tr>
        ))}
      </Panel>
    </div>
  );
}
