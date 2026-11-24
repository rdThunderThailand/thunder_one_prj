/** Default Program name for the wizard's Prepare Content step (ADR 0078 §10): one title as is,
 *  several as `<first> +N`. Playlist and Composition names are used as they are. */
export function defaultProgramName(titles: ReadonlyArray<string | null | undefined>): string | undefined {
  const first = titles[0]?.trim();
  if (!first) return undefined;
  return titles.length === 1 ? first : `${first} +${titles.length - 1}`;
}
