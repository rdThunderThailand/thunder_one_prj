// Support Channel configuration for the Help panel (Help Spec §5: "Support Channel — escalation
// boundary; destination implementation may be configured separately"). Read on the server from env
// and handed to the client panel; a channel that is not configured is simply not shown.

export interface HelpSupportConfig {
  /** Generic contact page (also used by the public Help Center). */
  contactUrl?: string;
  chatUrl?: string;
  email?: string;
  phone?: string;
  /** Free text, e.g. "Mon – Fri, 09:00 – 18:00 (ICT)". */
  hours?: string;
  statusUrl?: string;
}

export function hasSupportChannel(s: HelpSupportConfig | undefined): boolean {
  return !!(s && (s.contactUrl || s.chatUrl || s.email || s.phone));
}
