"use client";

import { useSearchParams } from "next/navigation";
import { HelpPageShell } from "@/features/help/components/HelpPageShell";
import { HelpUnavailable } from "@/features/help/components/HelpStates";
import { readHelpParams } from "@/features/help/params";
import { helpHref } from "@/features/help/navigation";

// HLP-008 — the Help Center itself failed. Retry re-renders the segment; nothing outside Help is touched (D-G6-04).
export default function HelpError({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  const params = readHelpParams(Object.fromEntries(useSearchParams()));
  const { locale, from } = params;
  return (
    <HelpPageShell locale={locale} from={from} localeHrefs={{ th: helpHref("/", { lang: "th", from }), en: helpHref("/", { lang: "en", from }) }}>
      <HelpUnavailable locale={locale} onRetry={() => unstable_retry()} />
    </HelpPageShell>
  );
}
