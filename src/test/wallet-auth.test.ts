// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import bs58 from "bs58";
import { ed25519 } from "@noble/curves/ed25519.js";
import { CHALLENGE_TTL, consumeChallenge, issueChallenge, SESSION_TTL, walletRole, type Challenge, type TemporaryStore } from "../../services/wallet-auth/src/core";
import { WalletTTL } from "../../services/wallet-auth/src/worker";
const domain = "https://certichain.test";
const key = new Uint8Array(32).fill(5);
const publicKey = bs58.encode(ed25519.getPublicKey(key));
const sign = (c: Challenge) => ({ nonce: c.nonce, publicKey, message: c.message, signature: bs58.encode(ed25519.sign(new TextEncoder().encode(c.message), key)) });
class MemoryStore implements TemporaryStore {
  data = new Map<string, unknown>();
  async get<T>(key: string) { return this.data.get(key) as T | undefined; }
  async put<T>(key: string, value: T) { this.data.set(key, value); }
  async delete(key: string) { return this.data.delete(key); }
  async list<T>(options?: { prefix?: string }) { return new Map([...this.data].filter(([key]) => !options?.prefix || key.startsWith(options.prefix))) as Map<string, T>; }
  async setAlarm(_time: number) {}
}
describe("signature and single-use nonce", () => {
  let store: MemoryStore;
  beforeEach(() => { store = new MemoryStore(); });
  it("uses unpredictable distinct 256-bit nonces with five-minute expiry", async () => {
    const a = await issueChallenge(store, publicKey, domain, 1000);
    const b = await issueChallenge(store, publicKey, domain, 1000);
    expect(a.nonce).toMatch(/^[a-f0-9]{64}$/); expect(a.nonce).not.toBe(b.nonce);
    expect(a.expiresAt - a.issuedAt).toBe(5 * 60 * 1000); expect(CHALLENGE_TTL).toBe(300000);
  });
  it("accepts a real Ed25519 signature", async () => {
    const c = await issueChallenge(store, publicKey, domain, 1000);
    expect(await consumeChallenge(store, sign(c), domain, 2000)).toBe(publicKey);
  });
  it("rejects invalid signatures without consuming the nonce", async () => {
    const c = await issueChallenge(store, publicKey, domain, 1000);
    await expect(consumeChallenge(store, { ...sign(c), signature: bs58.encode(new Uint8Array(64)) }, domain, 2000)).rejects.toThrow("Tanda tangan");
    expect(await store.get(`nonce:${c.nonce}`)).toBeDefined();
  });
  it("rejects expired nonces at the five-minute boundary", async () => {
    const c = await issueChallenge(store, publicKey, domain, 1000);
    await expect(consumeChallenge(store, sign(c), domain, 301000)).rejects.toThrow("kedaluwarsa");
  });
  it("rejects replay after successful verification", async () => {
    const c = await issueChallenge(store, publicKey, domain, 1000);
    await consumeChallenge(store, sign(c), domain, 2000);
    await expect(consumeChallenge(store, sign(c), domain, 2001)).rejects.toThrow("sudah digunakan");
  });
  it("rejects a different domain", async () => {
    const c = await issueChallenge(store, publicKey, domain, 1000);
    await expect(consumeChallenge(store, sign(c), "https://other.test", 2000)).rejects.toThrow("tidak sesuai");
  });
  it("rejects a different wallet", async () => {
    const c = await issueChallenge(store, publicKey, domain, 1000);
    await expect(consumeChallenge(store, { ...sign(c), publicKey: bs58.encode(new Uint8Array(32)) }, domain, 2000)).rejects.toThrow("tidak sesuai");
  });
  it("requires the exact original challenge message", async () => {
    const c = await issueChallenge(store, publicKey, domain, 1000);
    await expect(consumeChallenge(store, { ...sign(c), message: "" }, domain, 2000)).rejects.toThrow("tidak sesuai");
  });
  it("does not grant issuer role without trusted server configuration", () => {
    expect(walletRole(publicKey, "")).toBe("wallet"); expect(walletRole(publicKey, publicKey)).toBe("issuer");
    expect(SESSION_TTL).toBe(3600000);
  });
  it("serializes concurrent replay, issues secure cookie, reads session and logs out", async () => {
    let queue = Promise.resolve();
    const state = { storage: store, blockConcurrencyWhile: <T,>(cb: () => Promise<T>) => { const result = queue.then(cb); queue = result.then(() => undefined, () => undefined); return result; } };
    const worker = new WalletTTL(state, { APP_ORIGIN: domain, ISSUER_WALLETS: "", WALLET_TTL: {} as never });
    const challengeResponse = await worker.fetch(new Request(`${domain}/api/public/wallet/challenge`, { method: "POST", body: JSON.stringify({ publicKey }) }));
    const { challenge } = await challengeResponse.json() as { challenge: Challenge };
    const verify = () => worker.fetch(new Request(`${domain}/api/public/wallet/verify`, { method: "POST", body: JSON.stringify(sign(challenge)) }));
    const responses = await Promise.all([verify(), verify()]);
    expect(responses.map(r => r.status).sort()).toEqual([200, 400]);
    const success = responses.find(r => r.status === 200);
    const cookie = success?.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("HttpOnly; Secure; SameSite=Strict; Max-Age=3600");
    const headers = { cookie };
    const read = await worker.fetch(new Request(`${domain}/api/public/wallet/session`, { headers }));
    expect((await read.json() as { session: { publicKey: string } }).session.publicKey).toBe(publicKey);
    await worker.fetch(new Request(`${domain}/api/public/wallet/logout`, { method: "POST", headers }));
    const after = await worker.fetch(new Request(`${domain}/api/public/wallet/session`, { headers }));
    expect((await after.json() as { session: unknown }).session).toBeNull();
  });
});