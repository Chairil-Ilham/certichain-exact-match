import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileCheck2, FolderKanban, History, KeyRound, SearchCheck, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/app/public-layout";
import { PrototypeNotice, StatusBadge } from "@/components/app/bits";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CertiChain — Verifikasi Sertifikat Akademik dengan Mudah" },
      { name: "description", content: "Periksa keabsahan sertifikat akademik menggunakan kode verifikasi unik. Prototype dengan data demonstrasi." },
      { property: "og:title", content: "CertiChain — Verifikasi Sertifikat Akademik" },
      { property: "og:description", content: "Periksa keabsahan sertifikat akademik menggunakan kode verifikasi unik." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { Icon: SearchCheck, title: "Verifikasi berdasarkan kode", text: "Siapa pun dapat memeriksa status sertifikat tanpa login." },
  { Icon: FolderKanban, title: "Pengelolaan sertifikat", text: "Admin menambah, mengubah, dan mencabut sertifikat." },
  { Icon: Wallet, title: "Integrasi Phantom Wallet", text: "Hubungkan wallet Solana sebagai fondasi identitas Web3." },
  { Icon: History, title: "Riwayat dan status", text: "Status valid atau dicabut beserta catatan aktivitas." },
];

const STEPS = [
  "Sertifikat diterbitkan atau dicatat oleh admin.",
  "Sertifikat memiliki kode verifikasi unik.",
  "Publik memasukkan kode tersebut.",
  "Sistem menampilkan hasil pemeriksaan berdasarkan data sumber.",
];

function Landing() {
  return (
    <PublicLayout>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" /> Prototype akademik
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Verifikasi Sertifikat Akademik dengan Mudah
          </h1>
          <p className="mt-4 max-w-lg text-lg text-muted-foreground">
            Masukkan kode verifikasi untuk memeriksa apakah sebuah sertifikat digital tercatat dan masih berlaku.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/verify"><SearchCheck /> Verifikasi Sertifikat</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/login">Masuk ke Dashboard <ArrowRight /></Link></Button>
          </div>
        </div>
        <CertificateIllustration />
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">Fitur</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ Icon, title, text }) => (
              <div key={title} className="rounded-xl border bg-background p-5">
                <span className="grid size-10 place-items-center rounded-lg bg-accent text-primary"><Icon className="size-5" /></span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Cara kerja</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s} className="rounded-xl border bg-card p-5 shadow-card">
              <span className="font-mono text-sm text-primary">0{i + 1}</span>
              <p className="mt-2 text-sm">{s}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="rounded-2xl border bg-card p-6 sm:p-8">
          <div className="flex items-center gap-2"><KeyRound className="size-5 text-primary" /><h2 className="text-xl font-semibold">Transparansi</h2></div>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>• Versi ini menggunakan data demonstrasi sintetis yang tersimpan di browser Anda.</li>
            <li>• Status blockchain hanya akan ditampilkan jika transaksi on-chain benar-benar telah diverifikasi — saat ini belum ada.</li>
            <li>• Menghubungkan Phantom Wallet hanya membaca alamat publik; bukan autentikasi terverifikasi.</li>
          </ul>
          <PrototypeNotice className="mt-5" />
        </div>
      </section>
    </PublicLayout>
  );
}

function CertificateIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden>
      <div className="absolute -right-3 -top-3 h-full w-full rounded-2xl border bg-accent" />
      <div className="relative rounded-2xl border bg-card p-7 shadow-card">
        <div className="flex items-center justify-between">
          <FileCheck2 className="size-8 text-primary" />
          <StatusBadge status="valid" />
        </div>
        <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">Sertifikat</p>
        <p className="mt-1 text-xl font-semibold">Juara 1 Lomba Pemrograman</p>
        <p className="mt-4 text-sm text-muted-foreground">Diberikan kepada</p>
        <p className="font-medium">Andi Pratama</p>
        <div className="mt-6 flex items-end justify-between border-t pt-4">
          <div>
            <p className="text-xs text-muted-foreground">Kode verifikasi</p>
            <p className="font-mono text-sm">CC-7KQ2-M9XA</p>
          </div>
          <span className="rounded bg-warning-soft px-2 py-0.5 text-xs text-warning">Contoh demo</span>
        </div>
      </div>
    </div>
  );
}
