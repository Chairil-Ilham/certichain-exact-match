import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, FileX, SearchCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/app/public-layout";
import { CopyButton, EmptyState, PrototypeNotice, SourceBadge, StatusBadge } from "@/components/app/bits";
import { getCertificateByCode } from "@/lib/store";
import { useData } from "@/lib/use-data";
import { formatDate, formatDateTime, maskNim } from "@/lib/format";

export const Route = createFileRoute("/certificate/$code")({
  ssr: false,
  head: ({ params }) => ({
    meta: [
      { title: `Sertifikat ${params.code} — CertiChain` },
      { name: "description", content: "Detail sertifikat akademik dan status verifikasinya." },
      { property: "og:title", content: `Sertifikat ${params.code} — CertiChain` },
      { property: "og:description", content: "Detail sertifikat akademik dan status verifikasinya." },
    ],
  }),
  component: Detail,
});

function Detail() {
  const { code } = Route.useParams();
  const router = useRouter();
  const data = useData(() => getCertificateByCode(code), [code]);

  return (
    <PublicLayout>
      <section className="mx-auto max-w-3xl px-4 py-10">
        <Button variant="ghost" size="sm" onClick={() => router.history.back()}><ArrowLeft /> Kembali</Button>
        {data.status === "loading" && <div className="mt-4 h-80 animate-pulse rounded-xl border bg-muted" />}
        {data.status === "error" && <p className="mt-4 text-destructive">{data.error}</p>}
        {data.status === "ready" && !data.data && (
          <div className="mt-4"><EmptyState Icon={FileX} title="Sertifikat tidak ditemukan">Kode <span className="font-mono">{code}</span> tidak terdaftar.</EmptyState></div>
        )}
        {data.status === "ready" && data.data && (() => {
          const { certificate: c, student: s } = data.data;
          return (
            <div className="mt-4 rounded-xl border bg-card shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b p-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Sertifikat</p>
                  <h1 className="mt-1 text-2xl font-semibold">{c.certificate_name}</h1>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <dl className="grid gap-5 p-6 text-sm sm:grid-cols-2">
                <F l="Nama penerima" v={s?.nama ?? "-"} />
                <F l="NIM (disamarkan)" v={s ? <span className="font-mono">{maskNim(s.nim)}</span> : "-"} />
                <F l="Program studi" v={s?.program_studi ?? "-"} />
                <F l="Institusi penerbit" v={c.institution} />
                <F l="Tanggal penerbitan" v={formatDate(c.issue_date)} />
                <F l="Kode verifikasi" v={<span className="font-mono">{c.verification_code}</span>} />
                {c.description && <div className="sm:col-span-2"><F l="Deskripsi" v={c.description} /></div>}
              </dl>
              <div className="border-t p-6">
                <h2 className="text-sm font-semibold">Ringkasan pemeriksaan</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Kode ditemukan pada data demo dengan status <strong>{c.status === "valid" ? "Valid" : "Dicabut"}</strong>. Terakhir diperbarui {formatDateTime(c.updated_at)}. Tidak ada data on-chain untuk sertifikat ini.
                </p>
                <div className="mt-3"><SourceBadge source="demo" /></div>
              </div>
              <div className="flex flex-wrap gap-2 border-t p-6">
                <CopyButton value={c.verification_code} />
                <Button asChild size="sm"><Link to="/verify" search={{ code: c.verification_code }}><SearchCheck /> Buka verifikasi publik</Link></Button>
              </div>
            </div>
          );
        })()}
        <PrototypeNotice className="mt-6" />
      </section>
    </PublicLayout>
  );
}

function F({ l, v }: { l: string; v: React.ReactNode }) {
  return <div><dt className="text-muted-foreground">{l}</dt><dd className="mt-0.5 font-medium">{v}</dd></div>;
}
