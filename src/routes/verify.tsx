import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Ban, BadgeCheck, Loader2, SearchCheck, SearchX } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicLayout } from "@/components/app/public-layout";
import { PrototypeNotice, SourceBadge, StatusBadge } from "@/components/app/bits";
import { verifyCode } from "@/lib/store";
import { formatDate } from "@/lib/format";
import type { VerifyResult } from "@/lib/types";

export const Route = createFileRoute("/verify")({
  validateSearch: z.object({ code: z.string().max(40).optional() }),
  head: () => ({
    meta: [
      { title: "Verifikasi Sertifikat — CertiChain" },
      { name: "description", content: "Masukkan kode verifikasi untuk memeriksa keabsahan sertifikat akademik." },
      { property: "og:title", content: "Verifikasi Sertifikat — CertiChain" },
      { property: "og:description", content: "Periksa keabsahan sertifikat akademik berdasarkan kode verifikasi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const { code: initial } = Route.useSearch();
  const navigate = useNavigate({ from: "/verify" });
  const [code, setCode] = useState(initial ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const run = async (value: string) => {
    if (!value.trim()) {
      setInputError("Masukkan kode verifikasi");
      return;
    }
    setInputError(null);
    setLoading(true);
    setResult(await verifyCode(value));
    setLoading(false);
  };

  useEffect(() => {
    if (initial) {
      setCode(initial);
      void run(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  return (
    <PublicLayout>
      <section className="mx-auto max-w-2xl px-4 py-14">
        <h1 className="text-3xl font-bold tracking-tight">Verifikasi Sertifikat</h1>
        <p className="mt-2 text-muted-foreground">Masukkan kode verifikasi yang tertera pada sertifikat, misalnya <span className="font-mono">CC-7KQ2-M9XA</span>.</p>

        <form
          className="mt-8 rounded-xl border bg-card p-5 shadow-card"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ search: { code: code.trim().toUpperCase() || undefined } });
            if (code.trim().toUpperCase() === initial) void run(code);
          }}
        >
          <Label htmlFor="code">Kode verifikasi</Label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="CC-XXXX-XXXX"
              className="h-11 font-mono uppercase" maxLength={40} aria-invalid={!!inputError} aria-describedby={inputError ? "code-err" : undefined} />
            <Button type="submit" size="lg" className="h-11" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <SearchCheck />} Periksa Sertifikat
            </Button>
          </div>
          {inputError && <p id="code-err" className="mt-2 text-sm text-destructive">{inputError}</p>}
        </form>

        <div className="mt-6" aria-live="polite">
          {loading && <div className="h-40 animate-pulse rounded-xl border bg-muted" />}
          {!loading && result && <ResultCard result={result} />}
        </div>

        <PrototypeNotice className="mt-8">
          Sumber data: data demo di browser ini. Pemeriksaan dilakukan pada data aplikasi, bukan pada blockchain. Tidak ada transaction signature yang ditampilkan karena belum ada pencatatan on-chain.
        </PrototypeNotice>
      </section>
    </PublicLayout>
  );
}

function ResultCard({ result }: { result: VerifyResult }) {
  if (result.state === "error")
    return (
      <div role="alert" className="flex gap-3 rounded-xl border border-warning/40 bg-warning-soft p-5">
        <AlertTriangle className="size-5 shrink-0 text-warning" />
        <div><p className="font-semibold">Gangguan sistem</p><p className="text-sm text-muted-foreground">{result.message} Ini bukan berarti sertifikat tidak valid — coba lagi nanti.</p></div>
      </div>
    );
  if (result.state === "not_found")
    return (
      <div className="flex gap-3 rounded-xl border bg-card p-5">
        <SearchX className="size-5 shrink-0 text-muted-foreground" />
        <div><p className="font-semibold">Tidak Ditemukan</p><p className="text-sm text-muted-foreground">Kode tersebut tidak terdaftar pada sumber data. Periksa kembali penulisan kode.</p></div>
      </div>
    );
  const { certificate: c, student: s } = result;
  const valid = result.state === "valid";
  return (
    <div className={`overflow-hidden rounded-xl border bg-card shadow-card ${valid ? "border-success/40" : "border-destructive/40"}`}>
      <div className={`flex items-center gap-3 px-5 py-4 ${valid ? "bg-success-soft" : "bg-destructive-soft"}`}>
        {valid ? <BadgeCheck className="size-6 text-success" /> : <Ban className="size-6 text-destructive" />}
        <div>
          <p className={`font-semibold ${valid ? "text-success" : "text-destructive"}`}>{valid ? "Valid" : "Dicabut"}</p>
          <p className="text-sm text-muted-foreground">{valid ? "Sertifikat tercatat dan berstatus aktif." : "Sertifikat tercatat tetapi telah dicabut penerbit."}</p>
        </div>
      </div>
      <dl className="grid gap-4 p-5 text-sm sm:grid-cols-2">
        <Field label="Nama penerima" value={s.nama} />
        <Field label="Nama sertifikat" value={c.certificate_name} />
        <Field label="Institusi" value={c.institution} />
        <Field label="Tanggal penerbitan" value={formatDate(c.issue_date)} />
        <Field label="Kode verifikasi" value={<span className="font-mono">{c.verification_code}</span>} />
        <Field label="Status" value={<StatusBadge status={c.status} />} />
      </dl>
      <div className="border-t px-5 py-3"><SourceBadge source={result.source} /></div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
