import type { TemporaryStore } from "./core";

export const RATE_WINDOW = 60_000;
export const RATE_LIMIT = 30;
export interface RateEntry { count: number; expiresAt: number }
/** Must run inside the same serialized storage operation as authentication. */
export async function allowRequest(store: TemporaryStore, client: string, now = Date.now()): Promise<boolean> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(client));
  const key = `rate:${Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("")}`;
  const previous = await store.get<RateEntry>(key);
  const entry = previous && previous.expiresAt > now ? previous : { count: 0, expiresAt: now + RATE_WINDOW };
  if (entry.count >= RATE_LIMIT) return false;
  await store.put(key, { ...entry, count: entry.count + 1 });
  return true;
}