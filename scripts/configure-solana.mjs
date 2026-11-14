import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { Keypair } from "@solana/web3.js";
const path = process.argv[2];
if (!path) throw new Error("Pass the real program deployment keypair path. This script does not deploy or generate a keypair.");
const id = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path, "utf8")))).publicKey.toBase58();
let config = readFileSync("solana/Anchor.toml", "utf8").replace(/\n\[programs\.devnet\][\s\S]*$/, "");
writeFileSync("solana/Anchor.toml", `${config}\n[programs.devnet]\ncertichain = "${id}"\n`);
mkdirSync("solana/idl", { recursive: true });
console.log(`Configured deployment identity: ${id}. Not proof of deployment. Set CERTICHAIN_PROGRAM_ID=${id} for anchor build.`);