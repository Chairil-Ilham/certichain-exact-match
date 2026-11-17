import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { Keypair } from "@solana/web3.js";
import { ed25519 } from "@noble/curves/ed25519.js";
export const issuerConfig = JSON.parse(readFileSync(new URL("../config/issuer.json", import.meta.url), "utf8"));
export function assertIssuerAddress(address) {
  if (address !== issuerConfig.publicAddress) throw new Error("Signing wallet does not match the configured candidate issuer. Stop before deployment or transactions.");
}
// Operator-only: run locally. Never upload, copy, write or print secret material.
export function loadVerifiedIssuer(path) {
  if (!path) throw new Error("Provide an external issuer signing-wallet path; never upload it to Lovable.");
  const signer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path, "utf8"))));
  assertIssuerAddress(signer.publicKey.toBase58());
  const challenge = randomBytes(32);
  if (!ed25519.verify(ed25519.sign(challenge, signer.secretKey.subarray(0, 32)), challenge, signer.publicKey.toBytes())) throw new Error("Issuer ownership signature failed");
  return signer;
}
