// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { Buffer } from "buffer";
import { Connection, PublicKey } from "@solana/web3.js";
import { requireDevnetIssuer } from "@/lib/issuer-authorization";
import { discriminator } from "@/lib/solana-discriminator";
import { ISSUER_ADDRESS } from "@/lib/issuer-config";

const program = new PublicKey(new Uint8Array(32).fill(4));
const loader = new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111");
function fixture() {
  const [programData] = PublicKey.findProgramAddressSync([program.toBuffer()], loader);
  const [configPda, bump] = PublicKey.findProgramAddressSync([Buffer.from("config")], program);
  const executable = Buffer.alloc(36); executable.writeUInt32LE(2); executable.set(programData.toBytes(), 4);
  const deployment = Buffer.alloc(45); deployment.writeUInt32LE(3); deployment[12] = 1; deployment.set(new PublicKey(ISSUER_ADDRESS).toBytes(), 13);
  const config = Buffer.alloc(41); config.set(discriminator("account:Config")); config.set(new PublicKey(ISSUER_ADDRESS).toBytes(), 8); config[40] = bump;
  const connection = new Connection("http://localhost:8899");
  vi.spyOn(connection, "getGenesisHash").mockResolvedValue("EtWTRABZaYq6iMfeYKouRu166VU2xqa1");
  vi.spyOn(connection, "getAccountInfo").mockImplementation(async key => ({ data: key.equals(program) ? executable : key.equals(programData) ? deployment : config, executable: key.equals(program), owner: key.equals(configPda) ? program : loader, lamports: 1, rentEpoch: 1 }));
  return { connection, configPda, deployment, config };
}
describe("verified network issuer boundary", () => {
  it("requires Devnet, executable ownership, programdata authority and config PDA", async () => {
    const { connection, configPda } = fixture(); expect(await requireDevnetIssuer(connection, program)).toEqual(configPda);
  });
  it("rejects another upgrade authority despite matching config", async () => {
    const { connection, deployment } = fixture(); deployment.set(program.toBytes(), 13);
    await expect(requireDevnetIssuer(connection, program)).rejects.toThrow("Upgrade authority");
  });
  it("rejects a corrupt config bump", async () => {
    const { connection, config } = fixture(); config[40] = (config[40] ?? 0) ^ 1;
    await expect(requireDevnetIssuer(connection, program)).rejects.toThrow("Konfigurasi authority");
  });
  it("rejects Mainnet before reading accounts", async () => {
    const { connection } = fixture(); vi.mocked(connection.getGenesisHash).mockResolvedValue("mainnet");
    await expect(requireDevnetIssuer(connection, program)).rejects.toThrow("bukan Solana Devnet");
    expect(connection.getAccountInfo).not.toHaveBeenCalled();
  });
});