import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import bs58 from "bs58";
import type { Transaction } from "@solana/web3.js";
import type { WalletState } from "@/lib/types";
import { authConfigured, walletAuthRequest, type WalletAuthSession, type WalletChallenge } from "@/lib/wallet-auth-api";
interface PhantomPublicKey { toString(): string }
interface PhantomProvider {
  isPhantom?: boolean; publicKey: PhantomPublicKey | null; isConnected: boolean;
  connect(opts?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: PhantomPublicKey }>;
  disconnect(): Promise<void>;
  signMessage(message: Uint8Array, encoding?: string): Promise<{ signature: Uint8Array }>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  on(event: "connect" | "disconnect" | "accountChanged", cb: (arg?: PhantomPublicKey | null) => void): void;
  removeListener?(event: string, cb: (arg?: PhantomPublicKey | null) => void): void;
  off?(event: string, cb: (arg?: PhantomPublicKey | null) => void): void;
}
declare global { interface Window { phantom?: { solana?: PhantomProvider }; solana?: PhantomProvider } }
function getProvider(): PhantomProvider | null {
  if (typeof window === "undefined") return null;
  const p = window.phantom?.solana ?? window.solana;
  return p?.isPhantom ? p : null;
}
interface WalletCtx extends WalletState {
  ready: boolean; error: string | null; loading: boolean; authSession: WalletAuthSession | null;
  connect: () => Promise<void>; authenticate: () => Promise<void>; disconnect: () => Promise<void>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
}
const Ctx = createContext<WalletCtx | null>(null);
export const PHANTOM_URL = "https://phantom.com/download";
const empty: WalletState = { public_key: null, connection_status: "disconnected", connected_at: null, backend_authenticated: false };
export function WalletAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>(empty);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authSession, setAuthSession] = useState<WalletAuthSession | null>(null);
  const providerRef = useRef<PhantomProvider | null>(null);
  const generation = useRef(0);
  const clearAuth = useCallback(async () => {
    generation.current++;
    setAuthSession(null);
    setState(s => ({ ...s, backend_authenticated: false }));
    if (authConfigured()) await walletAuthRequest("logout").catch(() => setError("Koneksi lokal diputuskan, tetapi sesi server belum dapat dicabut. Coba lagi ketika jaringan tersedia."));
  }, []);
  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    const timer = setTimeout(async () => {
      const provider = getProvider(); providerRef.current = provider;
      if (!provider) { setState(s => ({ ...s, connection_status: "unavailable" })); setReady(true); return; }
      const onConnect = (pk?: PhantomPublicKey | null) => {
        if (pk && !disposed) setState(s => ({ ...s, public_key: pk.toString(), connection_status: "connected", connected_at: s.connected_at ?? new Date().toISOString() }));
      };
      const onDisconnect = () => { if (!disposed) { setState(empty); void clearAuth(); } };
      const onAccount = (pk?: PhantomPublicKey | null) => { void clearAuth(); if (pk) onConnect(pk); else onDisconnect(); };
      provider.on("connect", onConnect); provider.on("disconnect", onDisconnect); provider.on("accountChanged", onAccount);
      cleanup = () => { for (const [event, cb] of [["connect", onConnect], ["disconnect", onDisconnect], ["accountChanged", onAccount]] as const) { if (provider.removeListener) provider.removeListener(event, cb); else provider.off?.(event, cb); } };
      try {
        const result = await provider.connect({ onlyIfTrusted: true }); onConnect(result.publicKey);
        if (authConfigured()) {
          const epoch = generation.current;
          const { session } = await walletAuthRequest<{ session: WalletAuthSession | null }>("session");
          if (!disposed && epoch === generation.current && session?.publicKey === provider.publicKey?.toString() && session.expiresAt > Date.now()) { setAuthSession(session); setState(s => ({ ...s, backend_authenticated: true })); }
        }
      } catch { /* Silent restoration never prompts or establishes authentication. */ }
      finally { if (!disposed) setReady(true); }
    }, 300);
    return () => { disposed = true; clearTimeout(timer); cleanup(); };
  }, [clearAuth]);
  useEffect(() => {
    if (!authSession) return;
    const check = async () => {
      const epoch = generation.current;
      try {
        const { session } = await walletAuthRequest<{ session: WalletAuthSession | null }>("session");
        if (epoch !== generation.current) return;
        if (!session || session.publicKey !== providerRef.current?.publicKey?.toString() || session.expiresAt <= Date.now()) { void clearAuth(); return; }
        setAuthSession(session);
      } catch { void clearAuth(); }
    };
    const timer = setInterval(() => void check(), 60000);
    const expiry = setTimeout(() => void clearAuth(), Math.max(0, authSession.expiresAt - Date.now()));
    return () => { clearInterval(timer); clearTimeout(expiry); };
  }, [authSession, clearAuth]);
  const authenticate = useCallback(async () => {
    const provider = providerRef.current; const pk = provider?.publicKey?.toString();
    if (!provider || !pk) return;
    setLoading(true); setError(null); const epoch = generation.current;
    try {
      const { challenge } = await walletAuthRequest<{ challenge: WalletChallenge }>("challenge", { publicKey: pk });
      if (challenge.publicKey !== pk || challenge.domain !== window.location.origin || challenge.expiresAt <= Date.now()) throw new Error("Challenge tidak sesuai domain atau wallet");
      const signed = await provider.signMessage(new TextEncoder().encode(challenge.message), "utf8");
      if (epoch !== generation.current || provider.publicKey?.toString() !== pk) return;
      const { session } = await walletAuthRequest<{ session: WalletAuthSession }>("verify", { ...challenge, signature: bs58.encode(signed.signature) });
      if (epoch !== generation.current || provider.publicKey?.toString() !== pk) { await clearAuth(); return; }
      if (session.publicKey !== pk || session.expiresAt <= Date.now()) throw new Error("Sesi wallet tidak sesuai");
      setAuthSession(session); setState(s => ({ ...s, backend_authenticated: true }));
    } catch (e) { setError(e instanceof Error ? e.message : "Autentikasi ditolak"); }
    finally { setLoading(false); }
  }, [clearAuth]);
  const connect = useCallback(async () => {
    setError(null); const provider = providerRef.current ?? getProvider();
    if (!provider) { setState(s => ({ ...s, connection_status: "unavailable" })); return; }
    providerRef.current = provider; setState(s => ({ ...s, connection_status: "connecting" }));
    try {
      const res = provider.isConnected && provider.publicKey ? { publicKey: provider.publicKey } : await provider.connect();
      setState(s => ({ ...s, public_key: res.publicKey.toString(), connection_status: "connected", connected_at: new Date().toISOString() }));
      await authenticate();
    } catch (e) { setState(empty); setError(e instanceof Error ? e.message : "Koneksi ditolak"); }
  }, [authenticate]);
  const disconnect = useCallback(async () => {
    await clearAuth();
    try { await providerRef.current?.disconnect(); } catch { setError("Phantom belum berhasil diputuskan. Coba lagi."); }
    finally { setState(empty); }
  }, [clearAuth]);
  const signTransaction = useCallback(async (tx: Transaction) => {
    const provider = providerRef.current;
    if (!provider?.isConnected || !authSession || authSession.publicKey !== provider.publicKey?.toString()) throw new Error("Autentikasi wallet diperlukan");
    const { session } = await walletAuthRequest<{ session: WalletAuthSession | null }>("session");
    if (!session || session.role !== "issuer" || session.publicKey !== provider.publicKey?.toString()) throw new Error("Wallet belum memiliki otorisasi penerbit");
    return provider.signTransaction(tx);
  }, [authSession]);
  const value = useMemo(() => ({ ...state, ready, loading, error, authSession, connect, authenticate, disconnect, signTransaction }), [state, ready, loading, error, authSession, connect, authenticate, disconnect, signTransaction]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const WalletProvider = WalletAuthProvider;
export function useWallet() { const v = useContext(Ctx); if (!v) throw new Error("WalletAuthProvider diperlukan"); return v; }
