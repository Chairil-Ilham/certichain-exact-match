import { Connection, PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";
import { ISSUER_ADDRESS } from "./issuer-config";
import { discriminator } from "./solana-discriminator";

/** Current network authorization, never activation evidence from a frontend flag. */
export async function requireDevnetIssuer(connection: Connection, program: PublicKey) {
  if (await connection.getGenesisHash() !== "EtWTRABZaYq6iMfeYKouRu166VU2xqa1") throw new Error("RPC bukan Solana Devnet");
  const loader = new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111");
  const account = await connection.getAccountInfo(program);
  const [programData] = PublicKey.findProgramAddressSync([program.toBuffer()], loader);
  if (!account?.executable || !account.owner.equals(loader) || account.data.length !== 36 || account.data.readUInt32LE(0) !== 2 || !new PublicKey(account.data.subarray(4, 36)).equals(programData)) throw new Error("Program executable atau identitas deployment tidak sesuai");
  const deployment = await connection.getAccountInfo(programData);
  if (!deployment || !deployment.owner.equals(loader) || deployment.data.length < 45 || deployment.data.readUInt32LE(0) !== 3 || deployment.data[12] !== 1 || new PublicKey(deployment.data.subarray(13, 45)).toBase58() !== ISSUER_ADDRESS) throw new Error("Upgrade authority program tidak sesuai kandidat penerbit");
  const [configPda, bump] = PublicKey.findProgramAddressSync([Buffer.from("config")], program);
  const config = await connection.getAccountInfo(configPda);
  if (!config || !config.owner.equals(program) || config.data.length !== 41 || config.data[40] !== bump || !discriminator("account:Config").every((byte, index) => config.data[index] === byte) || new PublicKey(config.data.subarray(8, 40)).toBase58() !== ISSUER_ADDRESS) throw new Error("Konfigurasi authority penerbit belum terverifikasi pada Devnet");
  return configPda;
}