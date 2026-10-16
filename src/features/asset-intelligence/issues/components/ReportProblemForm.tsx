"use client";

import { useState } from "react";
import { CheckCircleIcon } from "@/components/ui/icons";

interface ReportProblemFormProps {
  assetTag: string;
}

// Real, working form UI with real client-side state — but nothing is
// persisted or pushed to other pages. Consistent with every other action in
// this sprint (e.g. Technician's "Start" buttons): mock/no backend. Thunder
// Care's Work Queue already shows what this is meant to route to, seeded in
// ../mock-data.ts, rather than this form writing to it live.
export function ReportProblemForm({ assetTag }: ReportProblemFormProps) {
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-success-muted px-3 py-2.5 text-sm text-t1-green-700">
        <CheckCircleIcon className="h-4 w-4 shrink-0" />
        Sent to Thunder Care Service Operations.
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="flex flex-col gap-2"
    >
      <textarea
        required
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={`Describe the problem with ${assetTag}...`}
        rows={2}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground placeholder:text-t1-gray-400 focus:border-primary focus:outline-none"
      />
      <button
        type="submit"
        className="self-start rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Send Report
      </button>
    </form>
  );
}
