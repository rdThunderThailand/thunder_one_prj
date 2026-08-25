/** Strips HTML tags from pasted text so raw markup never reaches the API.
 *  React already escapes on render, so this is about what we store, not XSS in this app. */
export function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}
