import { createFileRoute, Link } from "@tanstack/react-router";
import { Ban, BadgeCheck, FileText, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoBadge, EmptyState, StatCard, StatusBadge } from "@/components/app/bits";
import { getStudent, listCertificatesForStudent } from "@/lib/store";
import { useData } from "@/lib/use-data";
import { formatDate } from "@/lib/format";
import { useCurrentStudentId } from "@/lib/session-helpers";

export const Route = createFileRoute("/student/")({ component: StudentHome });

function StudentHome() {
  const id = useCurrentStudentId();
  const st = useData(() => getStudent(id), [id]);
  const certs = useData(() => listCertificatesForStudent(id), [id]);

  if (st.status === "loading" || certs.status === "loading")
    return <div className="space-y-4"><div className="h-24 animate-pulse rounded-xl bg-muted" /><div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div></div>;
  if (st.status === "error" || certs.status === "error" || (st.status === "ready" && !st.data))
    return <EmptyState Icon={Info} title="Data mahasiswa tidak tersedia">Silakan keluar lalu pilih akun demo lain.</EmptyState>;

  const s = st.data!;
  const list = certs.data;
  const valid = list.filter((c) => c.status === "valid").length;
  const revoked = list.length - valid;
  const latest = [...list].sort((a, b) => b.issue_date.localeCompare(a.issue_date))[0];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold">Halo, {s.nama.split(" ")[0]}</h1><DemoBadge /></div>
        <p className="mt-1 text-sm text-muted-foreground">{s.nama} · <span className="font-mono">{s.nim}</span> · {s.program_studi}</p>
        <p className="mt-4 flex gap-2 rounded-lg bg-warning-soft p-3 text-xs text-foreground">
          <Info className="size-4 shrink-0 text-warning" />
          Identitas ini dipilih melalui mode demo — simulasi, bukan bukti kepemilikan akun akademik asli, dan tidak diautentikasi oleh wallet.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total sertifikat" value={list.length} Icon={FileText} />
        <StatCard label="Valid" value={valid} Icon={BadgeCheck} tone="success" />
        <StatCard label="Dicabut" value={revoked} Icon={Ban} tone="destructive" />
      </div>
      <div className="rounded-xl border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Sertifikat terbaru</h2><Button asChild variant="link" size="sm"><Link to="/student/certificates">Lihat semua</Link></Button></div>
        {latest ? (
          <Link to="/certificate/$code" params={{ code: latest.verification_code }} className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 hover:bg-muted">
            <div><p className="font-medium">{latest.certificate_name}</p><p className="text-sm text-muted-foreground">{latest.institution} · {formatDate(latest.issue_date)}</p></div>
            <StatusBadge status={latest.status} />
          </Link>
        ) : <p className="mt-3 text-sm text-muted-foreground">Belum ada sertifikat.</p>}
      </div>
    </div>
  );
}
