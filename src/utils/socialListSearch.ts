/** PostgREST `.or()` ve `ilike` için riskli karakterleri kaldırır. */
export function sanitizeSocialListSearchInput(raw: string): string {
  const collapsed = raw.trim().replace(/\s+/g, ' ');

  return collapsed.replace(/%/g, '').replace(/,/g, '');
}
