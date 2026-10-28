export function shortAddress(addr: string) {
  return addr.length > 10 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;
}

export function formatDate(iso: string) {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

/** Mask NIM for public display: DEMO24001 -> DEMO***01 */
export function maskNim(nim: string) {
  if (nim.length <= 4) return nim;
  return `${nim.slice(0, 4)}${"*".repeat(Math.max(nim.length - 6, 1))}${nim.slice(-2)}`;
}

export function matchesQuery(q: string, ...fields: string[]) {
  const n = q.trim().toLowerCase();
  if (!n) return true;
  return fields.some((f) => f.toLowerCase().includes(n));
}
