import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import type { Certificate } from "./types";

/** Versioned fixed-order UTF-8 JSON. Initial issuance status is always valid;
 * subsequent local/on-chain revocation must not alter the issuance commitment. */
export function canonicalCertificate(c: Certificate): string {
  const normalize = (value: string) => value.normalize("NFC");
  return JSON.stringify({
    schema: "certichain.certificate.v1",
    id: normalize(c.id),
    verification_code: normalize(c.verification_code),
    student_id: normalize(c.student_id),
    certificate_name: normalize(c.certificate_name),
    institution: normalize(c.institution),
    issue_date: c.issue_date,
    initial_status: "valid",
  });
}

export function certificateHash(c: Certificate): Uint8Array {
  return sha256(new TextEncoder().encode(canonicalCertificate(c)));
}
export function certificateHashHex(c: Certificate): string {
  return bytesToHex(certificateHash(c));
}
export function certificateSeed(c: Pick<Certificate, "id">): Uint8Array {
  return sha256(new TextEncoder().encode(c.id.normalize("NFC")));
}