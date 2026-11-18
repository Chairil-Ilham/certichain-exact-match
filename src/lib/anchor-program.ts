import idl from "../../config/anchor-idl.json";
import { discriminator } from "./solana-discriminator";

type IdlInstruction = { name: string; discriminator: number[]; accounts: { name: string }[] };
type DeploymentIdl = { address: string; instructions: IdlInstruction[]; types: { name: string; type: { fields: { name: string }[] } }[] };
const normalized = (value: string) => value.replaceAll("_", "").toLowerCase();
export function requireAnchorIdl(programId: string, candidate: unknown = idl): DeploymentIdl {
  if (!candidate || typeof candidate !== "object") throw new Error("IDL hasil build Anchor belum tersedia; konfigurasi ditolak.");
  const deployment = candidate as DeploymentIdl;
  if (deployment.address !== programId || !Array.isArray(deployment.instructions)) throw new Error("IDL tidak sesuai Program ID deployment");
  const layout = deployment.types?.find(type => normalized(type.name) === "certificaterecord")?.type.fields;
  if (layout?.map(field => normalized(field.name)).join(",") !== "certificatehash,issuer,createdat,revoked,bump,certificateseed") throw new Error("IDL memakai layout sertifikat lama; rebuild Anchor diperlukan");
  for (const [name, accounts] of [["simpan_sertifikat", "issuer,config,record,systemprogram"], ["cabut_sertifikat", "issuer,config,record"]] as const) {
    const instruction = deployment.instructions.find(item => normalized(item.name) === normalized(name));
    if (!instruction || instruction.accounts.map(account => normalized(account.name)).join(",") !== accounts || !discriminator(`global:${name}`).every((byte, index) => instruction.discriminator[index] === byte)) throw new Error("ABI Anchor tidak sesuai frontend");
  }
  return deployment;
}