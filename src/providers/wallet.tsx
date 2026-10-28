import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { WalletState } from "@/lib/types";

interface PhantomPublicKey { toString(): string }
interface PhantomProvider {
  isPhantom?: boolean;
  publicKey: PhantomPublicKey | null;
  isConnected: boolean;
  connect(opts?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: PhantomPublicKey }>;
  disconnect(): Promise<void>;
  on(event: "connect" | "disconnect" | "accountChanged", cb: (arg?: PhantomPublicKey | null) => void): void;
  removeListener?(event: string, cb: (...args: unknown[]) => void): void;
  off?(event: string, cb: (...args: unknown[]) => void): void;
}

declare global {
  interface Window {
    phantom?: { solana?: PhantomProvider };
    solana?: PhantomProvider;
  }
}

function getProvider(): PhantomProvider | null {
  if (typeof window === "undefined") return null;
  const p = window.phantom?.solana ?? window.solana;
  return p?.isPhantom ? p : null;
}

interface WalletCtx extends WalletState {
  ready: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const Ctx = createContext<WalletCtx | null>(null);
export const PHANTOM_URL = "https://phantom.com/download";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({ public_key: null, connection_status: "disconnected", connected_at: null, backend_authenticated: false });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const providerRef = useRef<PhantomProvider | null>(null);

  const setConnected = (pk: string) =>
    setState({ public_key: pk, connection_status: "connected", connected_at: new Date().toISOString(), backend_authenticated: false });
  const setDisconnected = () =>
    setState({ public_key: null, connection_status: "disconnected", connected_at: null, backend_authenticated: false });

  useEffect(() => {
    // Phantom injects asynchronously; give it a moment.
    const t = setTimeout(() => {
      const provider = getProvider();
      providerRef.current = provider;
      if (!provider) {
        setState((s) => ({ ...s, connection_status: "unavailable" }));
        setReady(true);
        return;
      }
      const onConnect = (pk?: PhantomPublicKey | null) => pk && setConnected(pk.toString());
      const onDisconnect = () => setDisconnected();
      const onAccount = (pk?: PhantomPublicKey | null) => {
        if (pk) setConnected(pk.toString());
        else setDisconnected();
      };
      provider.on("connect", onConnect);
      provider.on("disconnect", onDisconnect);
      provider.on("accountChanged", onAccount);
      // Silent restore: only succeeds if the user previously trusted this site. Never prompts.
      provider.connect({ onlyIfTrusted: true }).catch(() => undefined).finally(() => setReady(true));
    }, 300);
    return () => clearTimeout(t);
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    const provider = providerRef.current ?? getProvider();
    if (!provider) {
      setState((s) => ({ ...s, connection_status: "unavailable" }));
      return;
    }
    if (provider.isConnected && provider.publicKey) {
      setConnected(provider.publicKey.toString());
      return;
    }
    setState((s) => ({ ...s, connection_status: "connecting" }));
    try {
      const res = await provider.connect();
      setConnected(res.publicKey.toString());
    } catch (e) {
      setDisconnected();
      setError(e instanceof Error ? e.message : "Koneksi ditolak oleh pengguna");
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await providerRef.current?.disconnect();
    } finally {
      setDisconnected();
    }
  }, []);

  const value = useMemo(() => ({ ...state, ready, error, connect, disconnect }), [state, ready, error, connect, disconnect]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWallet must be used within WalletProvider");
  return v;
}
