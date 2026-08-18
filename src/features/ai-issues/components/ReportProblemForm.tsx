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
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
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
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <button
        type="submit"
        className="self-start rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
      >
        Send Report
      </button>
    </form>
  );
}
