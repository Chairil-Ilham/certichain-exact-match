import { Connection, PublicKey } from "@solana/web3.js";
import { requireAnchorIdl } from "./anchor-program";

export const solanaConfigured = () => Boolean(import.meta.env['VITE_SOLANA_PROGRAM_ID']);
export function solanaConnection() {
  const id = import.meta.env['VITE_SOLANA_PROGRAM_ID'];
  if (!id) throw new Error("Program Solana belum dideploy atau Program ID belum dikonfigurasi.");
  requireAnchorIdl(id);
  const rpc = import.meta.env['VITE_SOLANA_RPC_URL'] ?? "https://api.devnet.solana.com";
  return { program: new PublicKey(id), connection: new Connection(rpc, { commitment: "confirmed", fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(20000) }) }) };
}