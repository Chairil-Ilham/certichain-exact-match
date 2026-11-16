import config from "../../config/issuer.json";

// Public configuration, never wallet state, ownership proof or activation evidence.
export const ISSUER_ADDRESS = config.publicAddress;
export const ISSUER_NETWORK = config.network;
export function isIssuerCandidate(address: string | null | undefined): boolean {
  return address === ISSUER_ADDRESS;
}
export function requireIssuerCandidate(address: string): void {
  if (!isIssuerCandidate(address)) throw new Error("Wallet tidak sama dengan kandidat penerbit CertiChain");
}