import { helpHref } from "../navigation";
import { HelpPageShell } from "./HelpPageShell";

/**
 * Frame for HLP-007 loading states. loading.tsx cannot read the URL, so it keeps the header steady in
 * the default locale; the page replaces it as soon as it renders.
 */
export function HelpLoadingShell({ children }: { children: React.ReactNode }) {
  return (
    <HelpPageShell locale="th" from={null} localeHrefs={{ th: helpHref("/", { lang: "th" }), en: helpHref("/", { lang: "en" }) }}>
      {children}
    </HelpPageShell>
  );
}
