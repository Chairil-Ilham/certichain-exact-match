import { useState } from "react";
import { Loader2, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "./bits";
import { certificateFormSchema, type CertificateFormInput } from "@/lib/validation";
import { generateCode, listStudents } from "@/lib/store";
import { useData } from "@/lib/use-data";

type Errors = Partial<Record<keyof CertificateFormInput, string>>;

export function CertificateForm({ initial, editing, onSubmit }: { initial?: CertificateFormInput; editing?: boolean; onSubmit: (v: CertificateFormInput) => Promise<void> }) {
  const students = useData(() => listStudents());
  const [v, setV] = useState<CertificateFormInput>(initial ?? { student_id: "", certificate_name: "", institution: "Universitas Demo", issue_date: "", description: "", verification_code: generateCode() });
  const [errors, setErrors] = useState<Errors>({});
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverErr, setServerErr] = useState<string | null>(null);
  const set = <K extends keyof CertificateFormInput>(k: K, val: CertificateFormInput[K]) => { setV((p) => ({ ...p, [k]: val })); setErrors((e) => ({ ...e, [k]: undefined })); };
  const selected = students.status === "ready" ? students.data.find((s) => s.id === v.student_id) : undefined;

  const submit = async () => {
    setSaving(true); setServerErr(null);
    try { await onSubmit(v); } catch (e) { setServerErr(e instanceof Error ? e.message : "Gagal menyimpan"); }
    finally { setSaving(false); }
  };

  return (
    <form className="space-y-5 rounded-xl border bg-card p-6 shadow-card" noValidate onSubmit={(e) => {
      e.preventDefault();
      const r = certificateFormSchema.safeParse(v);
      if (!r.success) {
        const errs: Errors = {};
        r.error.issues.forEach((i) => { errs[i.path[0] as keyof CertificateFormInput] ??= i.message; });
        setErrors(errs);
        return;
      }
      setConfirm(true);
    }}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="student">Mahasiswa (nama & NIM)</Label>
          <Select value={v.student_id} onValueChange={(x) => set("student_id", x)}>
            <SelectTrigger id="student" className="mt-2" aria-invalid={!!errors.student_id}><SelectValue placeholder="Pilih mahasiswa" /></SelectTrigger>
            <SelectContent>{students.status === "ready" && students.data.map((s) => <SelectItem key={s.id} value={s.id}>{s.nama} — {s.nim}</SelectItem>)}</SelectContent>
          </Select>
          <E m={errors.student_id} />
        </div>
        <div><Label>Program studi</Label><Input className="mt-2" value={selected?.program_studi ?? ""} readOnly placeholder="Otomatis dari data mahasiswa" /></div>
        <div><Label>NIM</Label><Input className="mt-2 font-mono" value={selected?.nim ?? ""} readOnly placeholder="Otomatis" /></div>
        <div className="sm:col-span-2"><Label htmlFor="cn">Nama sertifikat</Label><Input id="cn" className="mt-2" value={v.certificate_name} onChange={(e) => set("certificate_name", e.target.value)} aria-invalid={!!errors.certificate_name} /><E m={errors.certificate_name} /></div>
        <div><Label htmlFor="inst">Penyelenggara / institusi</Label><Input id="inst" className="mt-2" value={v.institution} onChange={(e) => set("institution", e.target.value)} aria-invalid={!!errors.institution} /><E m={errors.institution} /></div>
        <div><Label htmlFor="date">Tanggal penerbitan</Label><Input id="date" type="date" className="mt-2" value={v.issue_date} onChange={(e) => set("issue_date", e.target.value)} aria-invalid={!!errors.issue_date} /><E m={errors.issue_date} /></div>
        <div className="sm:col-span-2"><Label htmlFor="desc">Deskripsi (opsional)</Label><Textarea id="desc" className="mt-2" rows={3} value={v.description} onChange={(e) => set("description", e.target.value)} /><E m={errors.description} /></div>
        <div className="sm:col-span-2">
          <Label htmlFor="code">Kode verifikasi (dibuat sistem)</Label>
          <div className="mt-2 flex gap-2">
            <Input id="code" readOnly className="font-mono" value={v.verification_code} />
            {!editing && <Button type="button" variant="outline" onClick={() => set("verification_code", generateCode())} aria-label="Buat kode baru"><RefreshCw /></Button>}
          </div>
          <E m={errors.verification_code} />
        </div>
      </div>
      {serverErr && <p role="alert" className="rounded-lg bg-destructive-soft p-3 text-sm text-destructive">{serverErr}</p>}
      <p className="text-xs text-muted-foreground">Menyimpan hanya mencatat sertifikat di data demo browser ini — tidak menerbitkannya ke blockchain.</p>
      <Button type="submit" disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Save />} {editing ? "Simpan perubahan" : "Simpan sertifikat"}</Button>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title={editing ? "Simpan perubahan?" : "Simpan sertifikat?"}
        description={<>Sertifikat <strong>{v.certificate_name}</strong> untuk <strong>{selected?.nama}</strong> dengan kode <span className="font-mono">{v.verification_code}</span>.</>}
        confirmLabel="Ya, simpan" onConfirm={() => void submit()} />
    </form>
  );
}

function E({ m }: { m?: string | undefined }) {
  return m ? <p className="mt-1 text-sm text-destructive">{m}</p> : null;
}
