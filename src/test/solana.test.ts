import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";
import { certificateHashHex } from "@/lib/certificate-hash";
import { decodeRecord, deriveCertificatePda, discriminator, compareRecord, verifyOnchain } from "@/lib/solana";
import type { Certificate } from "@/lib/types";
const c: Certificate = { id: "cert-1", verification_code: "CC-TEST-1234", student_id: "student-1", certificate_name: "Akademik", institution: "Universitas Demo", issue_date: "2026-11-14", description: "", status: "valid", created_at: "", updated_at: "" };
// Test fixture only, not a deployment identity.
const program = new PublicKey(new Uint8Array(32).fill(4));
describe("Solana account verification", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  it("uses stable ID-derived PDA, independent of edited certificate hash", () => {
    expect(deriveCertificatePda(c, program)).toEqual(deriveCertificatePda({ ...c, certificate_name: "Edited" }, program));
    expect(deriveCertificatePda(c, program)[0].toBase58()).not.toBe(deriveCertificatePda({ ...c, id: "other" }, program)[0].toBase58());
  });
  it("decodes the exact 82-byte Anchor record layout", () => {
    const data = Buffer.alloc(82); data.set(discriminator("account:CertificateRecord")); data.set(Buffer.from(certificateHashHex(c), "hex"), 8); data.set(program.toBytes(), 40); data.writeBigInt64LE(123n, 72); data[80] = 1; data[81] = 254;
    expect(decodeRecord(data)).toEqual({ hash: certificateHashHex(c), issuer: program.toBase58(), createdAt: 123, revoked: true, bump: 254 });
  });
  it("rejects incorrect account discriminator and size", () => { expect(() => decodeRecord(new Uint8Array(82))).toThrow(); expect(() => decodeRecord(new Uint8Array(81))).toThrow(); });
  it("separates matching, mismatch and revocation", () => {
    const record = { hash: "aa", issuer: "issuer", createdAt: 1, revoked: false, bump: 1 };
    expect(compareRecord(record, "aa")).toBe("match"); expect(compareRecord(record, "bb")).toBe("mismatch"); expect(compareRecord({ ...record, revoked: true }, "aa")).toBe("revoked");
  });
  it("never fabricates a chain result without configured Program ID", async () => {
    vi.stubEnv("VITE_SOLANA_PROGRAM_ID", ""); expect((await verifyOnchain(c)).state).toBe("unconfigured");
  });
  it("does not convert unavailable RPC to invalid certificate", async () => {
    vi.stubEnv("VITE_SOLANA_PROGRAM_ID", program.toBase58()); vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("RPC offline")));
    expect((await verifyOnchain(c)).state).toBe("network_error");
  });
});