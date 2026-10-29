import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DemoBadge, EmptyState, PageHeader } from "@/components/app/bits";
import { createStudent, listCertificates, listStudents } from "@/lib/store";
import { useData } from "@/lib/use-data";
import { matchesQuery } from "@/lib/format";
import { studentFormSchema } from "@/lib/validation";
import { ADMIN_ACTOR } from "./route";

export const Route = createFileRoute("/admin/students")({ component: Students });

function Students() {
  const studs = useData(() => listStudents());
  const certs = useData(() => listCertificates());
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ nama: "", nim: "", program_studi: "" });
  const [err, setErr] = useState<string | null>(null);
  const count = (id: string) => (certs.status === "ready" ? certs.data.filter((c) => c.student_id === id).length : 0);
  const list = studs.status === "ready" ? studs.data.filter((s) => matchesQuery(q, s.nama, s.nim, s.program_studi)) : [];

  return (
    <div>
      <PageHeader title="Data Mahasiswa" description="Seluruh data mahasiswa adalah data sintetis." />
      <form className="mb-6 grid gap-3 rounded-xl border bg-card p-5 shadow-card sm:grid-cols-4 sm:items-end" onSubmit={async (e) => {
        e.preventDefault();
        const r = studentFormSchema.safeParse(form);
        if (!r.success) { setErr(r.error.issues[0].message); return; }
        try { await createStudent(form, ADMIN_ACTOR); toast.success("Mahasiswa ditambahkan"); setForm({ nama: "", nim: "", program_studi: "" }); setErr(null); }
        catch (x) { setErr(x instanceof Error ? x.message : "Gagal"); }
      }}>
        <div><Label htmlFor="sn">Nama</Label><Input id="sn" className="mt-2" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} /></div>
        <div><Label htmlFor="snim">NIM</Label><Input id="snim" className="mt-2 font-mono" value={form.nim} onChange={(e) => setForm({ ...form, nim: e.target.value })} /></div>
        <div><Label htmlFor="sp">Program studi</Label><Input id="sp" className="mt-2" value={form.program_studi} onChange={(e) => setForm({ ...form, program_studi: e.target.value })} /></div>
        <Button type="submit"><UserPlus /> Tambah</Button>
        {err && <p className="text-sm text-destructive sm:col-span-4">{err}</p>}
      </form>
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Cari mahasiswa" placeholder="Cari nama, NIM, atau prodi" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {studs.status === "loading" && <div className="h-48 animate-pulse rounded-xl bg-muted" />}
      {studs.status === "ready" && list.length === 0 && <EmptyState Icon={Users} title="Mahasiswa tidak ditemukan" />}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => (
          <div key={s.id} className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-start justify-between gap-2"><p className="font-medium">{s.nama}</p>{s.mode_demo && <DemoBadge />}</div>
            <p className="font-mono text-sm text-muted-foreground">{s.nim}</p>
            <p className="text-sm text-muted-foreground">{s.program_studi}</p>
            <p className="mt-2 text-sm">{count(s.id)} sertifikat</p>
          </div>
        ))}
      </div>
    </div>
  );
}
