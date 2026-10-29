import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, PageHeader } from "@/components/app/bits";
import { resetDemoData } from "@/lib/store";

export const Route = createFileRoute("/admin/settings")({ component: Settings });

const STATUS = [
  ["Penyimpanan data", "localStorage browser (demo, tidak permanen)"],
  ["Autentikasi admin", "Kode akses demo — belum siap produksi"],
  ["Autentikasi wallet", "Belum diterapkan (perlu challenge + tanda tangan di backend)"],
  ["Pencatatan blockchain", "Belum diterapkan"],
];

function Settings() {
  const [open, setOpen] = useState(false);
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Pengaturan" />
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
