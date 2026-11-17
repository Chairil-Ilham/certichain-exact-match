// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { PublicKey } from "@solana/web3.js";
import { ISSUER_ADDRESS, ISSUER_NETWORK, isIssuerCandidate, requireIssuerCandidate } from "@/lib/issuer-config";
import { submitCertificate } from "@/lib/solana";
import { walletRole } from "../../services/wallet-auth/src/core";
import config from "../../config/issuer.json";
import type { Certificate } from "@/lib/types";
describe("candidate issuer boundaries", () => {
  it("uses the exact official Devnet candidate without activation", () => {
    expect(ISSUER_ADDRESS).toBe("DUPoMPmu5Hbsh1RNHuc2VMV3GVCZkj8ZEZbybk5fRh4k");
    expect(new PublicKey(ISSUER_ADDRESS).toBytes()).toHaveLength(32);
    expect(ISSUER_NETWORK).toBe("devnet");
    expect(config.status).toBe("candidate");
  });
  it("keeps ordinary wallets separate", () => {
    expect(isIssuerCandidate(ISSUER_ADDRESS)).toBe(true);
    expect(isIssuerCandidate(null)).toBe(false);
    expect(() => requireIssuerCandidate(new PublicKey(new Uint8Array(32).fill(4)).toBase58())).toThrow("kandidat");
  });
  it("does not authenticate from the public address", () => {
    expect(walletRole(ISSUER_ADDRESS, "")).toBe("wallet");
    expect(walletRole(ISSUER_ADDRESS, ISSUER_ADDRESS)).toBe("issuer");
  });
  for (const operation of ["record", "revoke"] as const) {
    it(`rejects non-issuer ${operation} before RPC or signing`, async () => {
      const sign = vi.fn();
      await expect(submitCertificate({} as Certificate, new PublicKey(new Uint8Array(32).fill(4)).toBase58(), sign, operation, vi.fn())).rejects.toThrow("kandidat");
      expect(sign).not.toHaveBeenCalled();
    });
  }
});
