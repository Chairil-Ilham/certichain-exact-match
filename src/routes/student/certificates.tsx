import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, FileText, Search, SearchCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CopyButton, EmptyState, PageHeader, StatusBadge } from "@/components/app/bits";
import { listCertificatesForStudent } from "@/lib/store";
import { useData } from "@/lib/use-data";
import { formatDate, matchesQuery } from "@/lib/format";
import { useCurrentStudentId } from "./route";

export const Route = createFileRoute("/student/certificates")({ component: MyCerts });

function MyCerts() {
  const id = useCurrentStudentId();
  const data = useData(() => listCertificatesForStudent(id), [id]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const list = useMemo(
    () => (data.status === "ready" ? data.data.filter((c) => matchesQuery(q, c.certificate_name, c.verification_code) && (status === "all" || c.status === status)) : []),
    [data, q, status],
  );

  return (
    <div>
      <PageHeader title="Sertifikat Saya" description="Hanya sertifikat yang terkait dengan akun yang sedang aktif." />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Cari sertifikat" placeholder="Cari nama sertifikat atau kode" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-44" aria-label="Filter status"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Semua status</SelectItem><SelectItem value="valid">Valid</SelectItem><SelectItem value="revoked">Dicabut</SelectItem></SelectContent>
        </Select>
      </div>
      {data.status === "loading" && <div className="space-y-3">{[0, 1].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div>}
      {data.status === "error" && <p className="text-destructive">{data.error}</p>}
      {data.status === "ready" && list.length === 0 && <EmptyState Icon={FileText} title="Tidak ada sertifikat">{data.data.length ? "Tidak ada yang cocok dengan pencarian." : "Akun ini belum memiliki sertifikat."}</EmptyState>}
      <div className="grid gap-4">
        {list.map((c) => (
          <div key={c.id} className="rounded-xl border bg-card p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{c.certificate_name}</p>
                <p className="text-sm text-muted-foreground">{c.institution} · {formatDate(c.issue_date)}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{c.verification_code}</p>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline"><Link to="/certificate/$code" params={{ code: c.verification_code }}><Eye /> Lihat detail</Link></Button>
              <CopyButton value={c.verification_code} />
              <Button asChild size="sm" variant="ghost"><Link to="/verify" search={{ code: c.verification_code }}><SearchCheck /> Verifikasi publik</Link></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
