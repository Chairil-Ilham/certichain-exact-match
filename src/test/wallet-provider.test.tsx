import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WalletAuthProvider, useWallet } from "@/providers/wallet";
vi.mock("@/lib/wallet-auth-api", () => ({ authConfigured: () => false, walletAuthRequest: () => Promise.reject(new Error("Not configured")) }));
function Harness() {
  const w = useWallet();
  return <><span data-testid="state">{w.connection_status}|{w.public_key}|{String(w.backend_authenticated)}</span><button onClick={() => void w.connect()}>connect</button><button onClick={() => void w.disconnect()}>disconnect</button></>;
}
describe("wallet lifecycle without auth service", () => {
  afterEach(() => { delete window.phantom; vi.restoreAllMocks(); });
  it("detects an absent Phantom without claiming authentication", async () => {
    render(<WalletAuthProvider><Harness /></WalletAuthProvider>);
    await waitFor(() => expect(screen.getByTestId("state").textContent).toBe("unavailable||false"));
  });
  it("connects, preserves connection across child navigation, clears on account changes and disconnects", async () => {
    const handlers = new Map<string, (pk?: { toString: () => string } | null) => void>();
    const pk = { toString: () => "wallet-A" };
    const provider = { isPhantom: true, isConnected: false, publicKey: null as { toString: () => string } | null,
      connect: vi.fn(async (options?: { onlyIfTrusted?: boolean }) => { if (options?.onlyIfTrusted) throw new Error("not trusted"); provider.isConnected = true; provider.publicKey = pk; return { publicKey: pk }; }),
      disconnect: vi.fn(async () => { provider.isConnected = false; provider.publicKey = null; }),
      signMessage: vi.fn(), signTransaction: vi.fn(),
      on: vi.fn((event: string, cb: (pk?: { toString: () => string } | null) => void) => { handlers.set(event, cb); }),
      removeListener: vi.fn((event: string) => { handlers.delete(event); }),
    };
    window.phantom = { solana: provider };
    const view = render(<WalletAuthProvider><Harness /></WalletAuthProvider>);
    await waitFor(() => expect(provider.connect).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByText("connect"));
    await waitFor(() => expect(screen.getByTestId("state").textContent).toBe("connected|wallet-A|false"));
    view.rerender(<WalletAuthProvider><div>another page</div><Harness /></WalletAuthProvider>);
    expect(provider.connect).toHaveBeenCalledTimes(2); expect(provider.signMessage).not.toHaveBeenCalled();
    act(() => handlers.get("accountChanged")?.({ toString: () => "wallet-B" }));
    expect(screen.getByTestId("state").textContent).toBe("connected|wallet-B|false");
    fireEvent.click(screen.getByText("disconnect"));
    await waitFor(() => expect(screen.getByTestId("state").textContent).toBe("disconnected||false"));
    expect(provider.disconnect).toHaveBeenCalled();
    view.unmount(); expect(handlers.size).toBe(0);
  });
});