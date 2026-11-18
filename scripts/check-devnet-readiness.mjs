import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { Keypair } from "@solana/web3.js";
import { loadVerifiedIssuer } from "./issuer-identity.mjs";

const issuer = loadVerifiedIssuer(process.argv[3]);
if (!process.argv[2]) throw new Error("Pass the external program keypair path.");
const program = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(process.argv[2], "utf8")))).publicKey.toBase58();
const proof = JSON.parse(readFileSync("solana/target/local-tests-passed.json", "utf8"));
const binaryHash = createHash("sha256").update(readFileSync("solana/target/deploy/certichain.so")).digest("hex");
if (proof.programId !== program || proof.issuer !== issuer.publicKey.toBase58() || proof.binaryHash !== binaryHash) throw new Error("Local test receipt does not match this binary, program or issuer. Rebuild and rerun local tests.");
const idl = JSON.parse(readFileSync("config/anchor-idl.json", "utf8"));
if (idl?.address !== program) throw new Error("Export the actual generated IDL first.");
console.log(`Local test receipt matches ${program}. This is an operator readiness check, not deployment or activation evidence. Check Devnet balance and deploy manually.`);