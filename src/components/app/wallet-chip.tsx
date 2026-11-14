import { Wallet } from "lucide-react";
import { useWallet } from "@/providers/wallet";
import { shortAddress } from "@/lib/format";

/** Read-only indicator. Never triggers a connection request. */
export function WalletChip() {
  const w = useWallet();
  if (w.connection_status !== "connected" || !w.public_key) return null;
  return (
    <span
      title={`Wallet terhubung (${w.backend_authenticated ? "autentikasi terverifikasi" : "belum terautentikasi"}): ${w.public_key}`}
      className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 font-mono text-xs text-foreground"
    >
      <span className="size-1.5 rounded-full bg-success" aria-hidden />
      <Wallet className="size-3.5" aria-hidden />
      {shortAddress(w.public_key)}
      {w.backend_authenticated && <span className="font-sans text-success">Terverifikasi</span>}
    </span>
  );
}
