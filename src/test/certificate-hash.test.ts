import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { canonicalCertificate, certificateHash, certificateHashHex } from "@/lib/certificate-hash";
import type { Certificate } from "@/lib/types";
export const fixture: Certificate = { id: "cert-1", verification_code: "CC-TEST-1234", student_id: "student-1", certificate_name: "Akademik", institution: "Universitas Demo", issue_date: "2026-11-14", description: "Tidak dicatat", status: "valid", created_at: "2026-11-14", updated_at: "2026-11-14" };
describe("certificate commitments", () => {
  it("is exactly 32 bytes / 64 hexadecimal characters using SHA-256", () => {
    expect(certificateHash(fixture)).toHaveLength(32);
    expect(certificateHashHex(fixture)).toMatch(/^[a-f0-9]{64}$/);
    expect(certificateHashHex(fixture)).toBe(createHash("sha256").update(canonicalCertificate(fixture)).digest("hex"));
  });
  it("same data gives the same hash regardless of property insertion order", () => {
    expect(certificateHashHex({ ...fixture })).toBe(certificateHashHex(fixture));
  });
  it.each(["id", "verification_code", "student_id", "certificate_name", "institution", "issue_date"] as const)("changing committed %s changes hash", key => {
    expect(certificateHashHex({ ...fixture, [key]: `${fixture[key]}x` })).not.toBe(certificateHashHex(fixture));
  });
  it("keeps local revocation distinct from the initial issuance commitment", () => {
    expect(certificateHashHex({ ...fixture, status: "revoked" })).toBe(certificateHashHex(fixture));
  });
  it("excludes description, NIM and student name from canonical payload", () => {
    expect(JSON.parse(canonicalCertificate(fixture))).toEqual({ schema: "certichain.certificate.v1", id: "cert-1", verification_code: "CC-TEST-1234", student_id: "student-1", certificate_name: "Akademik", institution: "Universitas Demo", issue_date: "2026-11-14", initial_status: "valid" });
  });
  it("normalizes Unicode NFC", () => {
    expect(certificateHashHex({ ...fixture, certificate_name: "Café" })).toBe(certificateHashHex({ ...fixture, certificate_name: "Cafe\u0301" }));
  });
});