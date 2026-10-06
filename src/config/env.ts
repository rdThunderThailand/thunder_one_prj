// Centralized access to environment variables.
// Add new vars here rather than reading process.env directly around the codebase.

export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  coreApiUrl: process.env.CORE_API_URL ?? "",
  coreApiKey: process.env.CORE_API_KEY ?? "",
  // Help "Contact Support" destination (URL or mailto:). Unset hides the action — Help Spec §5:
  // the Support Channel is an escalation boundary configured separately from Help itself.
  helpSupportUrl: process.env.NEXT_PUBLIC_HELP_SUPPORT_URL ?? "",
} as const;
