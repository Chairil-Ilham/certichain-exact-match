import { pageHead } from "@/lib/page-head";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, PageHeader } from "@/components/app/bits";
import { resetDemoData } from "@/lib/store";
import { ISSUER_ADDRESS } from "@/lib/issuer-config";
import { useWallet } from "@/providers/wallet";

export const Route = createFileRoute("/admin/settings")({ head: () => pageHead("Pengaturan", "Status integrasi dan pengaturan data demo CertiChain."), component: Settings });

const STATUS = [
  ["Penyimpanan data", "localStorage browser (demo, tidak permanen)"],
  ["Autentikasi admin", "Kode akses demo — belum siap produksi"],
  ["Autentikasi wallet", "Kode tersedia — layanan TTL belum dikonfigurasi atau diuji nyata"],
  ["Pencatatan blockchain", "Program Anchor tersedia — deployment Devnet belum diuji"],
];

function Settings() {
  const [open, setOpen] = useState(false);
  const wallet = useWallet();
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Pengaturan" />
      <section className="border-b pb-6" aria-label="Konfigurasi issuer">
        <h2 className="font-semibold">Wallet penerbit · Solana Devnet</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div><dt className="text-muted-foreground">Kandidat issuer resmi</dt><dd className="break-all font-mono">{ISSUER_ADDRESS}</dd></div>
          <div><dt className="text-muted-foreground">Status otorisasi Solana</dt><dd>Belum aktif — build dan pengujian program belum selesai</dd></div>
          <div><dt className="text-muted-foreground">Wallet pengguna terhubung</dt><dd className="break-all font-mono">{wallet.public_key ?? "Belum terhubung"}</dd></div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">Alamat publik bukan bukti kepemilikan. Deployment belum dilakukan; Admin Demo tidak memberi izin penerbit.</p>
      </section>
      <div className="rounded-xl border bg-card p-6 shadow-card">
        <h2 className="font-semibold">Status integrasi</h2>
        <dl className="mt-4 divide-y text-sm">
          {STATUS.map(([k, v]) => <div key={k} className="flex flex-col justify-between gap-1 py-2.5 sm:flex-row"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}
        </dl>
      </div>
      <div className="rounded-xl border bg-card p-6 shadow-card">
        <h2 className="font-semibold">Reset data demo</h2>
        <p className="mt-1 text-sm text-muted-foreground">Kembalikan seluruh mahasiswa, sertifikat, dan aktivitas ke data awal.</p>
        <Button variant="outline" className="mt-4" onClick={() => setOpen(true)}><RotateCcw /> Reset data</Button>
      </div>
      <ConfirmDialog open={open} onOpenChange={setOpen} destructive title="Reset data demo?" description="Semua perubahan yang Anda buat akan hilang." confirmLabel="Reset"
        onConfirm={async () => { await resetDemoData(); toast.success("Data demo direset"); }} />
    </div>
  );
}
