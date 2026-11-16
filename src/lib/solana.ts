import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { Buffer } from "buffer";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { certificateHash, certificateSeed } from "./certificate-hash";
import type { Certificate } from "./types";
import { ISSUER_ADDRESS, requireIssuerCandidate } from "./issuer-config";

export const discriminator = (name: string) => sha256(new TextEncoder().encode(name)).slice(0, 8);
export const solanaConfigured = () => Boolean(import.meta.env['VITE_SOLANA_PROGRAM_ID']);
function configuration() {
  const id = import.meta.env['VITE_SOLANA_PROGRAM_ID'];
  if (!id) throw new Error("Program Solana belum dideploy atau Program ID belum dikonfigurasi.");
  const rpc = import.meta.env['VITE_SOLANA_RPC_URL'] ?? "https://api.devnet.solana.com";
  return { program: new PublicKey(id), connection: new Connection(rpc, { commitment: "confirmed", fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(20000) }) }) };
}
export function deriveCertificatePda(c: Certificate, program: PublicKey) {
  return PublicKey.findProgramAddressSync([Buffer.from("certificate"), Buffer.from(certificateSeed(c))], program);
}
export interface OnchainRecord { hash: string; issuer: string; createdAt: number; revoked: boolean; bump: number }
export function decodeRecord(data: Uint8Array): OnchainRecord {
  if (data.length !== 82 || !discriminator("account:CertificateRecord").every((b, i) => data[i] === b)) throw new Error("Account sertifikat tidak sesuai program");
  if (data[80] !== 0 && data[80] !== 1) throw new Error("Status account tidak valid");
  const buffer = Buffer.from(data);
  return { hash: bytesToHex(data.slice(8, 40)), issuer: new PublicKey(data.slice(40, 72)).toBase58(), createdAt: Number(buffer.readBigInt64LE(72)), revoked: data[80] === 1, bump: data[81] ?? 0 };
}
export type ChainResult =
  | { state: "unconfigured" | "not_found" | "network_error"; message: string }
  | { state: "match" | "mismatch" | "revoked"; record: OnchainRecord; pda: string; program: string; slot: number; checkedAt: string };
export function compareRecord(record: OnchainRecord, expected: string): "match" | "mismatch" | "revoked" {
  return record.revoked ? "revoked" : record.hash === expected ? "match" : "mismatch";
}
async function requireDevnet(connection: Connection, program: PublicKey) {
  if (await connection.getGenesisHash() !== "EtWTRABZaYq6iMfeYKouRu166VU2xqa1") throw new Error("RPC bukan Solana Devnet");
  const account = await connection.getAccountInfo(program);
  if (!account?.executable) throw new Error("Program ID belum merupakan program executable");
}
export async function verifyOnchain(c: Certificate): Promise<ChainResult> {
  if (!solanaConfigured()) return { state: "unconfigured", message: "Program ID hasil deployment Devnet belum dikonfigurasi. Belum ada pemeriksaan jaringan." };
  try {
    const { program, connection } = configuration();
    await requireDevnet(connection, program);
    const [pda, bump] = deriveCertificatePda(c, program);
    const response = await connection.getAccountInfoAndContext(pda);
    if (!response.value) return { state: "not_found", message: "Data on-chain tidak ditemukan pada PDA sertifikat di Devnet." };
    if (!response.value.owner.equals(program)) throw new Error("Pemilik account tidak sesuai Program ID");
    const record = decodeRecord(response.value.data);
    if (record.bump !== bump) throw new Error("PDA bump tidak sesuai");
    if (record.issuer !== ISSUER_ADDRESS) throw new Error("Penerbit account tidak sesuai kandidat issuer CertiChain");
    return { state: compareRecord(record, bytesToHex(certificateHash(c))), record, pda: pda.toBase58(), program: program.toBase58(), slot: response.context.slot, checkedAt: new Date().toISOString() };
  } catch (error) { return { state: "network_error", message: `${error instanceof Error ? error.message : "RPC tidak tersedia"}. Pemeriksaan belum berhasil; bukan berarti sertifikat tidak valid.` }; }
}
export interface ChainReference { certificateId: string; signature: string; pda: string; issuer: string; hash: string; program: string; network: "devnet"; confirmedAt: string; operation: "record" | "revoke" }
export async function submitCertificate(c: Certificate, issuerAddress: string, sign: (tx: Transaction) => Promise<Transaction>, operation: "record" | "revoke", onStage: (stage: string) => void): Promise<ChainReference> {
  requireIssuerCandidate(issuerAddress);
  const { connection, program } = configuration();
  onStage("Memeriksa jaringan dan otorisasi penerbit…");
  await requireDevnet(connection, program);
  const issuer = new PublicKey(issuerAddress);
  const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], program);
  const config = await connection.getAccountInfo(configPda);
  if (!config || !config.owner.equals(program) || config.data.length !== 41 || !discriminator("account:Config").every((b, i) => config.data[i] === b) || !new PublicKey(config.data.subarray(8, 40)).equals(issuer)) throw new Error("Wallet tidak berwenang pada konfigurasi penerbit on-chain");
  const [pda, bump] = deriveCertificatePda(c, program);
  const hash = certificateHash(c);
  const name = operation === "record" ? "simpan_sertifikat" : "cabut_sertifikat";
  const keys = operation === "record" ? [
    { pubkey: issuer, isSigner: true, isWritable: true }, { pubkey: configPda, isSigner: false, isWritable: false },
    { pubkey: pda, isSigner: false, isWritable: true }, { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ] : [{ pubkey: issuer, isSigner: true, isWritable: false }, { pubkey: configPda, isSigner: false, isWritable: false }, { pubkey: pda, isSigner: false, isWritable: true }];
  const data = Buffer.concat([Buffer.from(discriminator(`global:${name}`)), Buffer.from(certificateSeed(c)), ...(operation === "record" ? [Buffer.from(hash)] : [])]);
  const blockhash = await connection.getLatestBlockhash();
  const tx = new Transaction({ ...blockhash, feePayer: issuer }).add(new TransactionInstruction({ programId: program, keys, data }));
  onStage("Menunggu persetujuan transaksi di Phantom…");
  const signed = await sign(tx);
  onStage("Mengirim transaksi ke Devnet…");
  const signature = await connection.sendRawTransaction(signed.serialize());
  onStage("Menunggu konfirmasi Devnet…");
  const confirmation = await connection.confirmTransaction({ ...blockhash, signature }, "confirmed");
  if (confirmation.value.err) throw new Error("Transaksi ditolak jaringan Devnet");
  const account = await connection.getAccountInfo(pda, { commitment: "confirmed", minContextSlot: confirmation.context.slot });
  if (!account || !account.owner.equals(program)) throw new Error("Transaksi dikonfirmasi tetapi account belum dapat diverifikasi. Periksa ulang; jangan kirim ulang otomatis.");
  const record = decodeRecord(account.data);
  if (record.bump !== bump || record.issuer !== issuerAddress || (operation === "record" && (record.hash !== bytesToHex(hash) || record.revoked)) || (operation === "revoke" && !record.revoked)) throw new Error("Account setelah transaksi tidak sesuai");
  return { certificateId: c.id, signature, pda: pda.toBase58(), issuer: issuerAddress, hash: record.hash, program: program.toBase58(), network: "devnet", confirmedAt: new Date().toISOString(), operation };
}
export const explorerAccount = (pda: string) => `https://explorer.solana.com/address/${encodeURIComponent(pda)}?cluster=devnet`;
export const explorerTransaction = (signature: string) => `https://explorer.solana.com/tx/${encodeURIComponent(signature)}?cluster=devnet`;