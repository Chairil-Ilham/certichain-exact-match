import { useEffect, useState } from "react";
import { Copy, ExternalLink, Loader2, RefreshCw, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/providers/wallet";
import { certificateHashHex } from "@/lib/certificate-hash";
import { explorerAccount, explorerTransaction, solanaConfigured, submitCertificate, verifyOnchain, type ChainResult, type ChainReference } from "@/lib/solana";
import { saveChainReference } from "@/lib/store";
import type { Certificate } from "@/lib/types";

export function BlockchainPanel({ certificate, admin = false }: { certificate: Certificate; admin?: boolean }) {
  const wallet = useWallet();
  const hash = certificateHashHex(certificate);
  const [result, setResult] = useState<ChainResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<ChainReference | null>(null);
  const [review, setReview] = useState<"record" | "revoke" | null>(null);
  useEffect(() => { setResult(null); setReference(null); setReview(null); }, [certificate.id, hash]);
  const check = async () => { setBusy(true); setError(null); setResult(await verifyOnchain(certificate)); setBusy(false); };
  const transact = async () => {
    if (!review || !wallet.public_key) return;
    setBusy(true); setError(null); setReference(null);
    try {
      const confirmed = await submitCertificate(certificate, wallet.public_key, wallet.signTransaction, review, setStage);
      setReference(confirmed);
      try { await saveChainReference(confirmed); } catch { setError("Transaksi dikonfirmasi, tetapi referensi browser gagal disimpan."); }
      setResult(await verifyOnchain(certificate));
      setReview(null); toast.success("Transaksi Devnet dikonfirmasi dan account diperiksa");
    } catch (e) { setError(e instanceof Error ? e.message : "Transaksi gagal. Tidak ada status berhasil yang disimpan."); }
    finally { setBusy(false); setStage(""); }
  };
  const verified = result && "record" in result ? result : null;
  const labels = { match: "Hash cocok", mismatch: "Hash tidak cocok", revoked: "Sertifikat dicabut on-chain", not_found: "Data on-chain tidak ditemukan", network_error: "Pemeriksaan jaringan gagal", unconfigured: "Belum dikonfigurasi" };
  const allowed = solanaConfigured() && wallet.backend_authenticated && wallet.authSession?.role === "issuer";
  return (
    <section className="mt-6 min-w-0 border-t pt-5" aria-label="Verifikasi Blockchain Solana">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold"><Link2 className="size-4" /> Verifikasi Blockchain Solana</h2>
        <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">Devnet · Mode Demo</span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Hash SHA-256 · data awal penerbitan</p>
      <p className="mt-1 break-all font-mono text-xs">{hash}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(hash); toast.success("Hash disalin"); } catch { toast.error("Hash tidak dapat disalin"); } }}><Copy /> Salin hash</Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void check()}>{busy ? <Loader2 className="animate-spin" /> : <RefreshCw />} Periksa Devnet</Button>
      </div>
      {!solanaConfigured() && <p className="mt-3 text-sm text-muted-foreground">Program ID hasil deployment belum tersedia. Tidak ada klaim pencatatan atau transaksi on-chain.</p>}
      {result && <div className="mt-4" aria-live="polite">
        <p className={`text-sm font-medium ${result.state === "match" ? "text-success" : result.state === "mismatch" || result.state === "revoked" ? "text-destructive" : "text-muted-foreground"}`}>{labels[result.state]}</p>
        {"message" in result && <p className="mt-1 text-sm text-muted-foreground">{result.message}</p>}
      </div>}
      {verified && <dl className="mt-3 space-y-2 text-xs">
        <div><dt className="text-muted-foreground">Hash on-chain</dt><dd className="break-all font-mono">{verified.record.hash}</dd></div>
        <div><dt className="text-muted-foreground">Penerbit</dt><dd className="break-all font-mono">{verified.record.issuer}</dd></div>
        <div><dt className="text-muted-foreground">PDA</dt><dd className="break-all font-mono">{verified.pda}</dd></div>
        <div><dt className="text-muted-foreground">Diperiksa pada slot</dt><dd>{verified.slot} · {verified.checkedAt}</dd></div>
        <Button asChild variant="outline" size="sm"><a href={explorerAccount(verified.pda)} target="_blank" rel="noreferrer"><ExternalLink /> Solana Explorer</a></Button>
      </dl>}
      {admin && <div className="mt-4 border-t pt-4">
        <Button size="sm" disabled={!allowed || busy || certificate.status === "revoked"} onClick={() => setReview("record")}><Link2 /> Catat Hash ke Blockchain</Button>
        <Button className="ml-2 mt-2" size="sm" variant="outline" disabled={!allowed || busy || !verified || verified.state === "revoked" || verified.record.issuer !== wallet.public_key} onClick={() => setReview("revoke")}>Cabut on-chain</Button>
        {!allowed && <p className="mt-2 text-xs text-muted-foreground">Memerlukan program Devnet serta sesi wallet penerbit yang diverifikasi server. Admin Demo tidak memberikan hak on-chain.</p>}
        {review && <div className="mt-4 space-y-3 border-l-2 border-primary pl-3">
          <p className="text-sm font-medium">Konfirmasi {review === "record" ? "pencatatan hash" : "pencabutan on-chain"}</p>
          <p className="text-sm">{certificate.certificate_name} · {certificate.verification_code}</p>
          <p className="break-all text-xs text-muted-foreground">Penerbit: {wallet.public_key} · Devnet. Memerlukan SOL Devnet untuk biaya jaringan. Status demo tidak berubah.</p>
          <Button size="sm" disabled={busy} onClick={() => void transact()}>{busy ? <Loader2 className="animate-spin" /> : <Link2 />} Setujui melalui Phantom</Button>
          <Button className="ml-2" size="sm" variant="ghost" disabled={busy} onClick={() => setReview(null)}>Batal</Button>
        </div>}
      </div>}
      {busy && stage && <p className="mt-3 text-sm" aria-live="polite">{stage}</p>}
      {error && <p className="mt-3 break-words text-sm text-destructive" role="alert">{error}</p>}
      {reference && <div className="mt-4 text-xs"><p className="font-medium text-success">Transaksi dikonfirmasi · Devnet</p><p className="mt-1 break-all font-mono">{reference.signature}</p><Button asChild className="mt-2" size="sm" variant="outline"><a href={explorerTransaction(reference.signature)} target="_blank" rel="noreferrer"><ExternalLink /> Detail transaksi</a></Button></div>}
    </section>
  );
}