export interface WalletAuthSession { publicKey: string; role: "wallet" | "issuer"; expiresAt: number }
export interface WalletChallenge { nonce: string; publicKey: string; domain: string; issuedAt: number; expiresAt: number; message: string }
export const authConfigured = () => import.meta.env['VITE_WALLET_AUTH_ENABLED'] === "true";
export async function walletAuthRequest<T>(action: "session" | "challenge" | "verify" | "logout", body?: unknown): Promise<T> {
  if (!authConfigured()) throw new Error("Layanan autentikasi sementara belum dikonfigurasi. Wallet terhubung belum berarti login terverifikasi.");
  const response = await fetch(`/api/public/wallet/${action}`, {
    method: action === "session" ? "GET" : "POST", credentials: "same-origin",
    headers: { "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Autentikasi tidak tersedia");
  return result as T;
}