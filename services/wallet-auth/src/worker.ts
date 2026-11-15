import { issueChallenge, consumeChallenge, randomToken, SESSION_TTL, walletRole, type Challenge, type WalletSession } from "./core";

interface Storage {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<unknown>;
  list<T>(opts?: { prefix?: string }): Promise<Map<string, T>>;
  setAlarm(time: number): Promise<void>;
}
interface State { storage: Storage; blockConcurrencyWhile<T>(cb: () => Promise<T>): Promise<T> }
interface Env {
  APP_ORIGIN: string;
  ISSUER_WALLETS?: string;
  WALLET_TTL: { idFromName(name: string): unknown; get(id: unknown): { fetch(request: Request): Promise<Response> } };
}
const json = (data: unknown, status = 200, cookie?: string) => new Response(JSON.stringify(data), {
  status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(cookie ? { "Set-Cookie": cookie } : {}) },
});
const cookie = (token: string, age: number) => `__Host-certichain-wallet=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
const cookieToken = (request: Request) => request.headers.get("cookie")?.split(";").map(x => x.trim()).find(x => x.startsWith("__Host-certichain-wallet="))?.split("=")[1];
async function sessionKey(token: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return `session:${Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("")}`;
}

/** Deploy under the SAME HTTPS origin as the app at /api/public/wallet/*.
 * Never allow browser-supplied origins or frontend demo roles as authorities. */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    let origin: string;
    try { origin = new URL(env.APP_ORIGIN).origin; } catch { return json({ error: "Autentikasi belum dikonfigurasi" }, 503); }
    if (!origin.startsWith("https://") || new URL(request.url).origin !== origin) return json({ error: "Domain tidak sesuai" }, 403);
    if (request.method !== "GET" && request.headers.get("origin") !== origin) return json({ error: "Origin tidak sesuai" }, 403);
    if (request.headers.get("sec-fetch-site") === "cross-site") return json({ error: "Permintaan lintas situs ditolak" }, 403);
    return env.WALLET_TTL.get(env.WALLET_TTL.idFromName(origin)).fetch(request);
  },
};

export class WalletTTL {
  constructor(private state: State, private env: Env) {}
  async alarm() {
    const entries = await this.state.storage.list<Challenge | WalletSession>();
    for (const [key, value] of entries) if (value.expiresAt <= Date.now()) await this.state.storage.delete(key);
    if (entries.size) await this.state.storage.setAlarm(Date.now() + 60000);
  }
  async fetch(request: Request): Promise<Response> {
    return this.state.blockConcurrencyWhile(async () => {
      const path = new URL(request.url).pathname;
      try {
        if (request.method === "GET" && path.endsWith("/session")) {
          const token = cookieToken(request);
          const session = token ? await this.state.storage.get<WalletSession>(await sessionKey(token)) : undefined;
          return json({ session: session && session.expiresAt > Date.now() ? { ...session, role: walletRole(session.publicKey, this.env.ISSUER_WALLETS ?? "") } : null });
        }
        if (request.method !== "POST") return json({ error: "Metode tidak didukung" }, 405);
        if (path.endsWith("/logout")) {
          const token = cookieToken(request);
          if (token) await this.state.storage.delete(await sessionKey(token));
          return json({ ok: true }, 200, cookie("", 0));
        }
        const body = await request.text();
        if (body.length > 4096) return json({ error: "Permintaan terlalu besar" }, 413);
        const input = JSON.parse(body) as Record<string, unknown>;
        if (path.endsWith("/challenge")) {
          if (typeof input['publicKey'] !== "string" || input['publicKey'].length > 50) return json({ error: "Alamat tidak valid" }, 400);
          await this.alarm();
          const entries = await this.state.storage.list({ prefix: "nonce:" });
          if (entries.size >= 1000) return json({ error: "Terlalu banyak permintaan, coba lagi nanti" }, 429);
          const challenge = await issueChallenge(this.state.storage, input['publicKey'], new URL(this.env.APP_ORIGIN).origin);
          await this.state.storage.setAlarm(Date.now() + 60000);
          return json({ challenge });
        }
        if (path.endsWith("/verify")) {
          const { nonce, publicKey, message, signature } = input;
          if (![nonce, publicKey, message, signature].every(x => typeof x === "string")) return json({ error: "Challenge tidak lengkap" }, 400);
          if (typeof nonce !== "string" || typeof publicKey !== "string" || typeof message !== "string" || typeof signature !== "string") return json({ error: "Challenge tidak lengkap" }, 400);
          const verifiedKey = await consumeChallenge(this.state.storage, { nonce, publicKey, message, signature }, new URL(this.env.APP_ORIGIN).origin);
          const previous = cookieToken(request);
          if (previous) await this.state.storage.delete(await sessionKey(previous));
          const token = randomToken();
          const session: WalletSession = { publicKey: verifiedKey, role: walletRole(verifiedKey, this.env.ISSUER_WALLETS ?? ""), expiresAt: Date.now() + SESSION_TTL };
          await this.state.storage.put(await sessionKey(token), session);
          await this.state.storage.setAlarm(Date.now() + 60000);
          return json({ session }, 200, cookie(token, SESSION_TTL / 1000));
        }
        return json({ error: "Endpoint tidak ditemukan" }, 404);
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : "Autentikasi ditolak" }, 400);
      }
    });
  }
}