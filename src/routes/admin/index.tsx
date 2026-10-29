import { createFileRoute, Link } from "@tanstack/react-router";
import { Ban, BadgeCheck, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, PrototypeNotice, StatCard } from "@/components/app/bits";
import { listActivity, listCertificates, listStudents } from "@/lib/store";
import { useData } from "@/lib/use-data";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/admin/")({ component: AdminHome });

function AdminHome() {
  const certs = useData(() => listCertificates());
  const studs = useData(() => listStudents());
  const act = useData(() => listActivity());
  const n = (v: number | undefined) => (v === undefined ? "…" : v);
  const list = certs.status === "ready" ? certs.data : undefined;
  const valid = list?.filter((c) => c.status === "valid").length;
  const revoked = list ? list.length - (valid ?? 0) : undefined;
  const pct = list && list.length ? Math.round(((valid ?? 0) / list.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Ringkasan" description="Semua angka dihitung langsung dari data demo saat ini." actions={<Button asChild><Link to="/admin/certificates/new">Tambah Sertifikat</Link></Button>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total sertifikat" value={n(list?.length)} Icon={FileText} />
        <StatCard label="Valid" value={n(valid)} Icon={BadgeCheck} tone="success" />
        <StatCard label="Dicabut" value={n(revoked)} Icon={Ban} tone="destructive" />
        <StatCard label="Mahasiswa" value={n(studs.status === "ready" ? studs.data.length : undefined)} Icon={Users} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-xl border bg-card p-6 shadow-card">
          <h2 className="font-semibold">Komposisi status</h2>
          <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-destructive-soft" role="img" aria-label={`${pct}% valid`}>
            <div className="bg-success" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-3 flex justify-between text-sm text-muted-foreground"><span>Valid {pct}%</span><span>Dicabut {list?.length ? 100 - pct : 0}%</span></div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Aktivitas terbaru</h2><Button asChild variant="link" size="sm"><Link to="/admin/activity">Semua</Link></Button></div>
          <ul className="mt-3 divide-y text-sm">
            {act.status === "ready" ? act.data.slice(0, 5).map((a) => (
              <li key={a.id} className="flex justify-between gap-3 py-2.5"><span><span className="font-medium">{a.actor}</span> — {a.action}</span><span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(a.created_at)}</span></li>
            )) : <li className="h-24 animate-pulse rounded bg-muted" />}
          </ul>
        </div>
      </div>
      <PrototypeNotice />
    </div>
  );
}
