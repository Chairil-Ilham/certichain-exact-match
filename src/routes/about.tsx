import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { PublicLayout } from "@/components/app/public-layout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Tentang — CertiChain" },
      { name: "description", content: "Tentang prototype CertiChain: fitur yang berfungsi, fitur simulasi, dan rencana integrasi blockchain." },
      { property: "og:title", content: "Tentang CertiChain" },
      { property: "og:description", content: "Fitur nyata vs simulasi pada prototype CertiChain." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: About,
});

const WORKING = [
  "Verifikasi sertifikat berdasarkan kode (pada data demo)",
  "Koneksi Phantom Wallet: hubungkan, putuskan, pergantian akun, pemulihan otomatis",
  "Login mahasiswa demo dengan pencarian nama/NIM",
  "Dashboard admin: tambah, ubah, cabut sertifikat, tambah mahasiswa, riwayat aktivitas",
];
const SIMULATED = [
  "Penyimpanan data: localStorage browser (bukan database permanen)",
  "Login admin & mahasiswa: sesi lokal, belum aman untuk produksi",
  "Autentikasi wallet via tanda tangan pesan: belum diterapkan",
  "Pencatatan sertifikat di blockchain Solana: belum diterapkan",
];

function About() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-3xl px-4 py-14">
        <h1 className="text-3xl font-bold tracking-tight">Tentang CertiChain</h1>
        <p className="mt-3 text-muted-foreground">
          CertiChain adalah prototype akademik untuk memverifikasi sertifikat menggunakan kode unik. Halaman ini menjelaskan dengan jujur apa yang sudah berfungsi dan apa yang masih simulasi.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <List title="Sudah berfungsi" items={WORKING} done />
          <List title="Simulasi / belum tersedia" items={SIMULATED} />
        </div>
        <div className="mt-10 rounded-xl border bg-card p-6 text-sm">
          <h2 className="font-semibold">Langkah berikutnya</h2>
          <p className="mt-2 text-muted-foreground">
            Menyambungkan database dan autentikasi backend, menerapkan login wallet dengan challenge + tanda tangan berisi nonce sekali pakai, lalu program Solana untuk mencatat hash sertifikat secara on-chain.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}

function List({ title, items, done }: { title: string; items: string[]; done?: boolean }) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-card">
      <h2 className="font-semibold">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            {done ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <CircleDashed className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
