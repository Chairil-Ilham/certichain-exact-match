import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { Buffer } from "buffer";
import { bytesToHex } from "@noble/hashes/utils.js";
import { certificateHash, certificateSeed } from "./certificate-hash";
import type { Certificate } from "./types";
import { ISSUER_ADDRESS, requireIssuerCandidate } from "./issuer-config";
import { discriminator } from "./solana-discriminator";
import { solanaConfigured, solanaConnection as configuration } from "./solana-connection";
import { requireDevnetIssuer } from "./issuer-authorization";

export { discriminator };
export { solanaConfigured };
export function deriveCertificatePda(c: Certificate, program: PublicKey) {
  return PublicKey.findProgramAddressSync([Buffer.from("certificate"), Buffer.from(certificateSeed(c))], program);
}
export interface OnchainRecord { hash: string; issuer: string; createdAt: number; revoked: boolean; bump: number; certificateSeed: string }
export function decodeRecord(data: Uint8Array): OnchainRecord {
  if (data.length !== 114 || !discriminator("account:CertificateRecord").every((b, i) => data[i] === b)) throw new Error("Account sertifikat tidak sesuai program");
  if (data[80] !== 0 && data[80] !== 1) throw new Error("Status account tidak valid");
  const buffer = Buffer.from(data);
  const createdAt = Number(buffer.readBigInt64LE(72));
  if (!Number.isSafeInteger(createdAt) || createdAt < 0 || createdAt > 8640000000000) throw new Error("Timestamp account tidak valid");
  return { hash: bytesToHex(data.slice(8, 40)), issuer: new PublicKey(data.slice(40, 72)).toBase58(), createdAt, revoked: data[80] === 1, bump: data[81] ?? 0, certificateSeed: bytesToHex(data.slice(82, 114)) };
}
export type ChainResult =
  | { state: "unconfigured" | "not_found" | "network_error"; message: string }
  | { state: "match" | "mismatch" | "revoked"; record: OnchainRecord; pda: string; program: string; slot: number; checkedAt: string };
export function compareRecord(record: OnchainRecord, expected: string): "match" | "mismatch" | "revoked" {
  return record.revoked ? "revoked" : record.hash === expected ? "match" : "mismatch";
}
export async function verifyOnchain(c: Certificate): Promise<ChainResult> {
  if (!solanaConfigured()) return { state: "unconfigured", message: "Program ID hasil deployment Devnet belum dikonfigurasi. Belum ada pemeriksaan jaringan." };
  try {
    const { program, connection } = configuration();
    await requireDevnetIssuer(connection, program);
    const [pda, bump] = deriveCertificatePda(c, program);
    const response = await connection.getAccountInfoAndContext(pda);
    if (!response.value) return { state: "not_found", message: "Data on-chain tidak ditemukan pada PDA sertifikat di Devnet." };
    if (!response.value.owner.equals(program)) throw new Error("Pemilik account tidak sesuai Program ID");
    const record = decodeRecord(response.value.data);
    if (record.bump !== bump || record.certificateSeed !== bytesToHex(certificateSeed(c))) throw new Error("PDA identifier atau bump tidak sesuai");
    if (record.issuer !== ISSUER_ADDRESS) throw new Error("Penerbit account tidak sesuai kandidat issuer CertiChain");
    return { state: compareRecord(record, bytesToHex(certificateHash(c))), record, pda: pda.toBase58(), program: program.toBase58(), slot: response.context.slot, checkedAt: new Date().toISOString() };
  } catch (error) { return { state: "network_error", message: `${error instanceof Error ? error.message : "RPC tidak tersedia"}. Pemeriksaan belum berhasil; bukan berarti sertifikat tidak valid.` }; }
}
export interface ChainReference { certificateId: string; signature: string; pda: string; issuer: string; hash: string; program: string; network: "devnet"; confirmedAt: string; operation: "record" | "revoke" }
export async function submitCertificate(c: Certificate, issuerAddress: string, sign: (tx: Transaction) => Promise<Transaction>, operation: "record" | "revoke", onStage: (stage: string) => void): Promise<ChainReference> {
  requireIssuerCandidate(issuerAddress);
  const { connection, program } = configuration();
  onStage("Memeriksa jaringan dan otorisasi penerbit…");
  const configPda = await requireDevnetIssuer(connection, program);
  const issuer = new PublicKey(issuerAddress);
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
  const requestedMessage = tx.serializeMessage();
  const signed = await sign(tx);
  if (!requestedMessage.equals(signed.serializeMessage())) throw new Error("Isi transaksi berubah setelah persetujuan; transaksi tidak dikirim");
  onStage("Mengirim transaksi ke Devnet…");
  const signature = await connection.sendRawTransaction(signed.serialize());
  onStage("Menunggu konfirmasi Devnet…");
  const confirmation = await connection.confirmTransaction({ ...blockhash, signature }, "confirmed");
  if (confirmation.value.err) throw new Error("Transaksi ditolak jaringan Devnet");
  const account = await connection.getAccountInfo(pda, { commitment: "confirmed", minContextSlot: confirmation.context.slot });
  if (!account || !account.owner.equals(program)) throw new Error("Transaksi dikonfirmasi tetapi account belum dapat diverifikasi. Periksa ulang; jangan kirim ulang otomatis.");
  const record = decodeRecord(account.data);
  if (record.bump !== bump || record.certificateSeed !== bytesToHex(certificateSeed(c)) || record.issuer !== issuerAddress || record.hash !== bytesToHex(hash) || (operation === "record" && record.revoked) || (operation === "revoke" && !record.revoked)) throw new Error("Account setelah transaksi tidak sesuai");
  return { certificateId: c.id, signature, pda: pda.toBase58(), issuer: issuerAddress, hash: record.hash, program: program.toBase58(), network: "devnet", confirmedAt: new Date().toISOString(), operation };
}
export const explorerAccount = (pda: string) => `https://explorer.solana.com/address/${encodeURIComponent(pda)}?cluster=devnet`;
export const explorerTransaction = (signature: string) => `https://explorer.solana.com/tx/${encodeURIComponent(signature)}?cluster=devnet`;