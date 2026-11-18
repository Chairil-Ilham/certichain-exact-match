// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { Buffer } from "buffer";
import { certificateHashHex, certificateSeed } from "@/lib/certificate-hash";
import { decodeRecord, deriveCertificatePda, discriminator, compareRecord, verifyOnchain } from "@/lib/solana";
import type { Certificate } from "@/lib/types";
const c: Certificate = { id: "cert-1", verification_code: "CC-TEST-1234", student_id: "student-1", certificate_name: "Akademik", institution: "Universitas Demo", issue_date: "2026-11-14", description: "", status: "valid", created_at: "", updated_at: "" };
// Test fixture only, not a deployment identity.
const program = new PublicKey(new Uint8Array(32).fill(4));
describe("Solana account verification", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  it("initializes and serializes SDK instructions using Buffer", () => {
    const transaction = new Transaction({ feePayer: program, recentBlockhash: program.toBase58() }).add(
      SystemProgram.transfer({ fromPubkey: program, toPubkey: new PublicKey(new Uint8Array(32).fill(5)), lamports: 1 }),
    );
    expect(transaction.instructions[0]?.data.readBigUInt64LE(4)).toBe(1n);
    expect(Transaction.from(transaction.serialize({ requireAllSignatures: false, verifySignatures: false })).instructions[0]?.data)
      .toEqual(transaction.instructions[0]?.data);
  });
  it("uses stable ID-derived PDA, independent of edited certificate hash", () => {
    expect(deriveCertificatePda(c, program)).toEqual(deriveCertificatePda({ ...c, certificate_name: "Edited" }, program));
    expect(deriveCertificatePda(c, program)[0].toBase58()).not.toBe(deriveCertificatePda({ ...c, id: "other" }, program)[0].toBase58());
  });
  it("decodes the exact 114-byte Anchor record including identifier", () => {
    const data = Buffer.alloc(114); data.set(discriminator("account:CertificateRecord")); data.set(Buffer.from(certificateHashHex(c), "hex"), 8); data.set(program.toBytes(), 40); data.writeBigInt64LE(123n, 72); data[80] = 1; data[81] = 254; data.set(certificateSeed(c), 82);
    expect(decodeRecord(data)).toEqual({ hash: certificateHashHex(c), issuer: program.toBase58(), createdAt: 123, revoked: true, bump: 254, certificateSeed: Buffer.from(certificateSeed(c)).toString("hex") });
  });
  it("rejects incorrect account discriminator and size", () => { expect(() => decodeRecord(new Uint8Array(82))).toThrow(); expect(() => decodeRecord(new Uint8Array(81))).toThrow(); });
  it("separates matching, mismatch and revocation", () => {
    const record = { hash: "aa", issuer: "issuer", createdAt: 1, revoked: false, bump: 1, certificateSeed: "aa" };
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