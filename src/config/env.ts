// Centralized access to environment variables.
// Add new vars here rather than reading process.env directly around the codebase.

export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
} as const;
