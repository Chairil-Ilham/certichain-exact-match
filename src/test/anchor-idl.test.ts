// @vitest-environment node
import { describe, expect, it } from "vitest";
import { requireAnchorIdl } from "@/lib/anchor-program";
import { discriminator } from "@/lib/solana-discriminator";

// ABI fixture only; never shipped as generated IDL or deployment evidence.
const fixture = {
  address: "test-program",
  types: [{ name: "CertificateRecord", type: { fields: ["certificate_hash", "issuer", "created_at", "revoked", "bump", "certificate_seed"].map(name => ({ name })) } }],
  instructions: [
    { name: "simpan_sertifikat", discriminator: [...discriminator("global:simpan_sertifikat")], accounts: ["issuer", "config", "record", "system_program"].map(name => ({ name })) },
    { name: "cabut_sertifikat", discriminator: [...discriminator("global:cabut_sertifikat")], accounts: ["issuer", "config", "record"].map(name => ({ name })) },
  ],
};
describe("deployment IDL gate", () => {
  it("fails closed without an actual generated IDL", () => { expect(() => requireAnchorIdl("test-program", null)).toThrow("belum tersedia"); });
  it("requires the exact deployment address", () => { expect(() => requireAnchorIdl("other", fixture)).toThrow("Program ID"); });
  it("checks instruction account ordering and discriminator", () => {
    expect(requireAnchorIdl("test-program", fixture)).toBe(fixture);
    const changed = structuredClone(fixture); const instruction = changed.instructions[1];
    if (!instruction) throw new Error("Missing fixture instruction");
    instruction.accounts.reverse();
    expect(() => requireAnchorIdl("test-program", changed)).toThrow("ABI");
  });
  it("rejects old records without stored certificate identifier", () => {
    const changed = structuredClone(fixture); const record = changed.types[0];
    if (!record) throw new Error("Missing fixture record");
    record.type.fields.pop();
    expect(() => requireAnchorIdl("test-program", changed)).toThrow("layout");
  });
});