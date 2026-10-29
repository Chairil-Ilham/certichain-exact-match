import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpDown, Ban, Eye, FilePlus2, FileText, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog, EmptyState, PageHeader, StatusBadge } from "@/components/app/bits";
import { CertificateForm } from "@/components/app/certificate-form";
import { listActivity, listCertificates, listStudents, revokeCertificate, updateCertificate } from "@/lib/store";
import { useData } from "@/lib/use-data";
import { formatDate, formatDateTime, matchesQuery } from "@/lib/format";
import type { Certificate } from "@/lib/types";
import { ADMIN_ACTOR } from "./route";

export const Route = createFileRoute("/admin/certificates/")({ component: CertTable });

const PAGE = 6;
type SortKey = "issue_date" | "certificate_name" | "nama";

function CertTable() {
  const certs = useData(() => listCertificates());
  const studs = useData(() => listStudents());
  const acts = useData(() => listActivity());
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "issue_date", dir: -1 });
  const [page, setPage] = useState(1);
  const [revoking, setRevoking] = useState<Certificate | null>(null);
  const [editing, setEditing] = useState<Certificate | null>(null);
  const [viewing, setViewing] = useState<Certificate | null>(null);

  const sMap = useMemo(() => new Map((studs.status === "ready" ? studs.data : []).map((s) => [s.id, s])), [studs]);
  const rows = useMemo(() => {
    if (certs.status !== "ready") return [];
    return certs.data
      .map((c) => ({ c, s: sMap.get(c.student_id) }))
      .filter(({ c, s }) => matchesQuery(q, c.verification_code, c.certificate_name, s?.nama ?? "", s?.nim ?? "") && (status === "all" || c.status === status))
      .sort((a, b) => {
        const va = sort.key === "nama" ? a.s?.nama ?? "" : a.c[sort.key];
        const vb = sort.key === "nama" ? b.s?.nama ?? "" : b.c[sort.key];
        return va.localeCompare(vb) * sort.dir;
      });
  }, [certs, sMap, q, status, sort]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const cur = Math.min(page, pages);
  const visible = rows.slice((cur - 1) * PAGE, cur * PAGE);
  const toggleSort = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1 }));
  const SortBtn = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <button type="button" onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-foreground">{children}<ArrowUpDown className="size-3" /></button>
  );

  return (
    <div>
      <PageHeader title="Data Sertifikat" description={certs.status === "ready" ? `${rows.length} dari ${certs.data.length} sertifikat` : "Memuat…"}
        actions={<Button asChild><Link to="/admin/certificates/new"><FilePlus2 /> Tambah</Link></Button>} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Cari" placeholder="Cari nama, NIM, kode, atau sertifikat" className="pl-9" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="sm:w-44" aria-label="Filter status"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Semua status</SelectItem><SelectItem value="valid">Valid</SelectItem><SelectItem value="revoked">Dicabut</SelectItem></SelectContent>
        </Select>
      </div>

      {certs.status === "loading" && <div className="h-64 animate-pulse rounded-xl bg-muted" />}
      {certs.status === "error" && <p className="text-destructive">{certs.error}</p>}
      {certs.status === "ready" && rows.length === 0 && <EmptyState Icon={FileText} title="Tidak ada sertifikat yang cocok" />}

      {visible.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border bg-card shadow-card md:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Kode</th>
                  <th className="px-4 py-3 font-medium"><SortBtn k="nama">Penerima</SortBtn></th>
                  <th className="px-4 py-3 font-medium"><SortBtn k="certificate_name">Sertifikat</SortBtn></th>
                  <th className="px-4 py-3 font-medium"><SortBtn k="issue_date">Terbit</SortBtn></th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visible.map(({ c, s }) => (
                  <tr key={c.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-mono text-xs">{c.verification_code}</td>
                    <td className="px-4 py-3"><p className="font-medium">{s?.nama}</p><p className="font-mono text-xs text-muted-foreground">{s?.nim}</p></td>
                    <td className="px-4 py-3">{c.certificate_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(c.issue_date)}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3"><Actions c={c} onView={setViewing} onEdit={setEditing} onRevoke={setRevoking} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {visible.map(({ c, s }) => (
              <div key={c.id} className="rounded-xl border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between gap-2"><p className="font-medium">{c.certificate_name}</p><StatusBadge status={c.status} /></div>
                <p className="mt-1 text-sm text-muted-foreground">{s?.nama} · {s?.nim}</p>
                <p className="text-sm text-muted-foreground">{formatDate(c.issue_date)} · <span className="font-mono">{c.verification_code}</span></p>
                <div className="mt-3"><Actions c={c} onView={setViewing} onEdit={setEditing} onRevoke={setRevoking} /></div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Halaman {cur} dari {pages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={cur <= 1} onClick={() => setPage(cur - 1)}>Sebelumnya</Button>
              <Button variant="outline" size="sm" disabled={cur >= pages} onClick={() => setPage(cur + 1)}>Berikutnya</Button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog open={!!revoking} onOpenChange={(o) => !o && setRevoking(null)} destructive title="Cabut sertifikat?"
        description={<>Sertifikat <span className="font-mono">{revoking?.verification_code}</span> akan berstatus <strong>Dicabut</strong> dan tidak dapat diubah lagi.</>}
        confirmLabel="Cabut sertifikat"
        onConfirm={async () => {
          if (!revoking) return;
          try { await revokeCertificate(revoking.id, ADMIN_ACTOR); toast.success("Sertifikat dicabut"); }
          catch (e) { toast.error(e instanceof Error ? e.message : "Gagal mencabut"); }
          setRevoking(null);
        }} />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Edit sertifikat</DialogTitle></DialogHeader>
          {editing && (
            <CertificateForm editing initial={{ student_id: editing.student_id, certificate_name: editing.certificate_name, institution: editing.institution, issue_date: editing.issue_date, description: editing.description, verification_code: editing.verification_code }}
              onSubmit={async (v) => { await updateCertificate(editing.id, v, ADMIN_ACTOR); toast.success("Perubahan disimpan"); setEditing(null); }} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{viewing?.certificate_name}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-4 text-sm">
              <dl className="grid grid-cols-2 gap-3">
                <div><dt className="text-muted-foreground">Penerima</dt><dd className="font-medium">{sMap.get(viewing.student_id)?.nama}</dd></div>
                <div><dt className="text-muted-foreground">Status</dt><dd><StatusBadge status={viewing.status} /></dd></div>
                <div><dt className="text-muted-foreground">Kode</dt><dd className="font-mono">{viewing.verification_code}</dd></div>
                <div><dt className="text-muted-foreground">Institusi</dt><dd>{viewing.institution}</dd></div>
              </dl>
              <div>
                <p className="font-medium">Riwayat perubahan</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  {acts.status === "ready" && acts.data.filter((a) => a.target_id === viewing.id).map((a) => <li key={a.id}>{formatDateTime(a.created_at)} — {a.action}</li>)}
                  <li>{formatDateTime(viewing.created_at)} — Dibuat</li>
                </ul>
              </div>
              <Button asChild variant="outline" size="sm"><Link to="/certificate/$code" params={{ code: viewing.verification_code }}>Buka halaman detail</Link></Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Actions({ c, onView, onEdit, onRevoke }: { c: Certificate; onView: (c: Certificate) => void; onEdit: (c: Certificate) => void; onRevoke: (c: Certificate) => void }) {
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" aria-label="Detail" onClick={() => onView(c)}><Eye /></Button>
      <Button variant="ghost" size="icon" aria-label="Edit" disabled={c.status === "revoked"} onClick={() => onEdit(c)}><Pencil /></Button>
      <Button variant="ghost" size="icon" aria-label="Cabut" disabled={c.status === "revoked"} className="text-destructive" onClick={() => onRevoke(c)}><Ban /></Button>
    </div>
  );
}
