import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const idl = JSON.parse(readFileSync("solana/target/idl/certichain.json", "utf8"));
if (!idl.address || !idl.instructions?.length) throw new Error("Generate the Anchor IDL from the configured build first.");
mkdirSync("solana/idl", { recursive: true });
writeFileSync("solana/idl/certichain.json", JSON.stringify(idl, null, 2));
console.log(`IDL exported for ${idl.address}. Verify deployment before setting VITE_SOLANA_PROGRAM_ID.`);