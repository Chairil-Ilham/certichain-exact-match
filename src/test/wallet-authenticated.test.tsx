import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WalletAuthProvider, useWallet } from "@/providers/wallet";
const api = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("@/lib/wallet-auth-api", () => ({ authConfigured: () => true, walletAuthRequest: api.request }));
function Harness() {
  const w = useWallet();
  return <><span data-testid="auth">{w.public_key}|{String(w.backend_authenticated)}</span><button onClick={() => void w.connect()}>connect</button><button onClick={() => void w.disconnect()}>disconnect</button></>;
}
describe("authenticated wallet account lifecycle", () => {
  afterEach(() => { delete window.phantom; vi.restoreAllMocks(); api.request.mockReset(); });
  it("invalidates previous session, signs a fresh account challenge and logs out on disconnect", async () => {
    const handlers = new Map<string, (pk?: { toString(): string } | null) => void>();
    const pk = (value: string) => ({ toString: () => value });
    const provider = { isPhantom: true, isConnected: false, publicKey: null as { toString(): string } | null,
      connect: vi.fn(async (options?: { onlyIfTrusted?: boolean }) => { if (options?.onlyIfTrusted) throw new Error("not trusted"); provider.publicKey = pk("wallet-A"); provider.isConnected = true; return { publicKey: provider.publicKey }; }),
      disconnect: vi.fn(async () => { provider.isConnected = false; provider.publicKey = null; }),
      signMessage: vi.fn(async () => ({ signature: new Uint8Array(64).fill(1) })), signTransaction: vi.fn(),
      on: (event: string, cb: (value?: { toString(): string } | null) => void) => { handlers.set(event, cb); }, removeListener: (event: string) => { handlers.delete(event); },
    };
    api.request.mockImplementation(async (action: string, body?: { publicKey: string }) => {
      if (action === "logout") return { ok: true };
      if (action === "challenge") return { challenge: { publicKey: body?.publicKey, domain: window.location.origin, purpose: "login", issuedAt: Date.now(), expiresAt: Date.now() + 300000, message: "test challenge", nonce: "test" } };
      return { session: { publicKey: body?.publicKey ?? provider.publicKey?.toString(), role: "wallet", expiresAt: Date.now() + 3600000 } };
    });
    window.phantom = { solana: provider };
    render(<WalletAuthProvider><Harness /></WalletAuthProvider>);
    await waitFor(() => expect(provider.connect).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByText("connect"));
    await waitFor(() => expect(screen.getByTestId("auth")).toHaveTextContent("wallet-A|true"));
    act(() => { provider.publicKey = pk("wallet-B"); handlers.get("accountChanged")?.(provider.publicKey); });
    expect(screen.getByTestId("auth")).toHaveTextContent("wallet-B|false");
    await waitFor(() => expect(screen.getByTestId("auth")).toHaveTextContent("wallet-B|true"));
    expect(provider.signMessage).toHaveBeenCalledTimes(2);
    expect(api.request).toHaveBeenCalledWith("challenge", { publicKey: "wallet-B", purpose: "login" });
    fireEvent.click(screen.getByText("disconnect"));
    await waitFor(() => expect(screen.getByTestId("auth").textContent).toBe("|false"));
    expect(api.request.mock.calls.filter(call => call[0] === "logout").length).toBeGreaterThanOrEqual(2);
  });
});