import bs58 from "bs58";
import { ed25519 } from "@noble/curves/ed25519.js";

export const CHALLENGE_TTL = 5 * 60 * 1000;
export const SESSION_TTL = 60 * 60 * 1000;
export interface Challenge { nonce: string; publicKey: string; domain: string; issuedAt: number; expiresAt: number; message: string }
export interface WalletSession { publicKey: string; role: "issuer" | "wallet"; expiresAt: number }
export interface TemporaryStore {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<unknown>;
}
export function randomToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join("");
}
export function challengeMessage(c: Omit<Challenge, "message">): string {
  return `${c.domain} meminta autentikasi CertiChain.\nWallet: ${c.publicKey}\nTujuan: Login wallet CertiChain (bukan transaksi)\nDibuat: ${new Date(c.issuedAt).toISOString()}\nKedaluwarsa: ${new Date(c.expiresAt).toISOString()}\nNonce: ${c.nonce}`;
}
export async function issueChallenge(store: TemporaryStore, publicKey: string, domain: string, now = Date.now()): Promise<Challenge> {
  if (bs58.decode(publicKey).length !== 32) throw new Error("Alamat wallet tidak valid");
  const base = { nonce: randomToken(), publicKey, domain, issuedAt: now, expiresAt: now + CHALLENGE_TTL };
  const challenge = { ...base, message: challengeMessage(base) };
  await store.put(`nonce:${challenge.nonce}`, challenge);
  return challenge;
}

/** Caller MUST serialize this read/verify/delete sequence. The DO uses
 * blockConcurrencyWhile; a plain distributed get/delete is not atomic. */
export async function consumeChallenge(store: TemporaryStore, input: { nonce: string; publicKey: string; message: string; signature: string }, domain: string, now = Date.now()): Promise<string> {
  const c = await store.get<Challenge>(`nonce:${input.nonce}`);
  if (!c) throw new Error("Challenge tidak ditemukan atau sudah digunakan");
  if (c.expiresAt <= now || c.issuedAt > now) throw new Error("Challenge kedaluwarsa");
  if (c.domain !== domain || c.publicKey !== input.publicKey || c.message !== input.message || c.message !== challengeMessage(c)) throw new Error("Challenge tidak sesuai");
  let valid = false;
  try { valid = ed25519.verify(bs58.decode(input.signature), new TextEncoder().encode(c.message), bs58.decode(c.publicKey)); } catch { /* reject malformed input */ }
  if (!valid) throw new Error("Tanda tangan tidak valid");
  await store.delete(`nonce:${c.nonce}`);
  return c.publicKey;
}
export function walletRole(publicKey: string, issuers: string): WalletSession["role"] {
  return issuers.split(",").map(s => s.trim()).filter(Boolean).includes(publicKey) ? "issuer" : "wallet";
}