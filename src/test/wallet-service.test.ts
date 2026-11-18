// @vitest-environment node
import { describe, expect, it } from "vitest";
import bs58 from "bs58";
import { ed25519 } from "@noble/curves/ed25519.js";
import worker, { WalletTTL } from "../../services/wallet-auth/src/worker";
import { allowRequest } from "../../services/wallet-auth/src/rate-limit";
import { issueChallenge, type Challenge } from "../../services/wallet-auth/src/core";
import issuerConfig from "../../config/issuer.json";

class Storage {
  data = new Map<string, unknown>();
  async get<T>(key: string) { return this.data.get(key) as T | undefined; }
  async put<T>(key: string, value: T) { this.data.set(key, value); }
  async delete(key: string) { return this.data.delete(key); }
  async list<T>() { return new Map(this.data) as Map<string, T>; }
  async setAlarm(_time: number) {}
}
const domain = "https://certichain.test";
function service() {
  const storage = new Storage(); let queue = Promise.resolve();
  const state = { storage, blockConcurrencyWhile: <T,>(cb: () => Promise<T>) => { const result = queue.then(cb); queue = result.then(() => undefined, () => undefined); return result; } };
  return { storage, ttl: new WalletTTL(state, { APP_ORIGIN: domain, WALLET_TTL: {} as never }) };
}
describe("temporary authentication security", () => {
  it("limits each client to 30 requests per minute and permits a new window", async () => {
    const storage = new Storage();
    for (let i = 0; i < 30; i++) expect(await allowRequest(storage, "client", 1000)).toBe(true);
    expect(await allowRequest(storage, "client", 2000)).toBe(false);
    expect(await allowRequest(storage, "other", 2000)).toBe(true);
    expect(await allowRequest(storage, "client", 61000)).toBe(true);
  });
  it("rejects CSRF origins before forwarding to TTL storage", async () => {
    const env = { APP_ORIGIN: domain, WALLET_TTL: { idFromName: () => "one", get: () => ({ fetch: async () => new Response("unexpected", { status: 200 }) }) } };
    expect((await worker.fetch(new Request(`${domain}/auth/challenge`, { method: "POST", headers: { origin: "https://evil.test" } }), env)).status).toBe(403);
    expect((await worker.fetch(new Request(`https://evil.test/auth/session`), env)).status).toBe(403);
  });
  it("binds special issuer purpose to the exact candidate without activating it", async () => {
    const { ttl } = service();
    const response = await ttl.fetch(new Request(`${domain}/auth/challenge`, { method: "POST", body: JSON.stringify({ publicKey: issuerConfig.publicAddress, purpose: "issuer-ownership" }) }));
    const { challenge } = await response.json() as { challenge: Challenge };
    expect(challenge.publicKey).toBe("DUPoMPmu5Hbsh1RNHuc2VMV3GVCZkj8ZEZbybk5fRh4k");
    expect(challenge.purpose).toBe("issuer-ownership");
    const other = bs58.encode(ed25519.getPublicKey(new Uint8Array(32).fill(7)));
    expect((await ttl.fetch(new Request(`${domain}/auth/challenge`, { method: "POST", body: JSON.stringify({ publicKey: other, purpose: "issuer-ownership" }) }))).status).toBe(403);
  });
  it("normal login signatures do not grant issuer ownership", async () => {
    const { ttl, storage } = service(); const key = new Uint8Array(32).fill(7); const publicKey = bs58.encode(ed25519.getPublicKey(key));
    const challenge = await issueChallenge(storage, publicKey, domain);
    const response = await ttl.fetch(new Request(`${domain}/auth/verify`, { method: "POST", body: JSON.stringify({ ...challenge, signature: bs58.encode(ed25519.sign(new TextEncoder().encode(challenge.message), key)) }) }));
    expect(response.status).toBe(200);
    expect((await response.json() as { session: { ownershipVerified: boolean; role: string } }).session).toMatchObject({ ownershipVerified: false, role: "wallet" });
  });
  it("cleans expired nonce, session and rate counters but preserves live entries", async () => {
    const { ttl, storage } = service();
    for (const key of ["nonce:old", "session:old", "rate:old"]) await storage.put(key, { expiresAt: 0 });
    await storage.put("session:live", { expiresAt: Date.now() + 60000 });
    await ttl.alarm();
    expect([...storage.data.keys()]).toEqual(["session:live"]);
  });
  it("rejects oversized streamed bodies and unknown endpoint suffixes", async () => {
    const { ttl } = service();
    expect((await ttl.fetch(new Request(`${domain}/auth/challenge`, { method: "POST", body: "x".repeat(4097) }))).status).toBe(413);
    expect((await ttl.fetch(new Request(`${domain}/auth/fake/session`))).status).toBe(404);
  });
});