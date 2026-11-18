import { sha256 } from "@noble/hashes/sha2.js";
export const discriminator = (name: string) => sha256(new TextEncoder().encode(name)).slice(0, 8);