import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, ExternalLink, GraduationCap, Loader2, LogIn, Search, ShieldAlert, Unplug, UserCog, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicLayout } from "@/components/app/public-layout";
import { DemoBadge } from "@/components/app/bits";
import { PHANTOM_URL, useWallet } from "@/providers/wallet";
import { DEMO_ADMIN_CODE, useSession } from "@/providers/session";
import { listStudents } from "@/lib/store";
import { useData } from "@/lib/use-data";
import { matchesQuery, shortAddress } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — CertiChain" },
      { name: "description", content: "Masuk dengan Phantom Wallet, sebagai mahasiswa demo, atau sebagai admin demo." },
      { property: "og:title", content: "Login — CertiChain" },
      { property: "og:description", content: "Masuk ke CertiChain." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Masuk ke CertiChain</h1>
        <p className="mt-2 text-muted-foreground">Pilih metode masuk. Setiap metode memiliki sesi yang terpisah.</p>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <PhantomCard />
          <StudentDemoCard />
        </div>
        <AdminDemoCard />
      </section>
    </PublicLayout>
  );
}

function PhantomCard() {
  const w = useWallet();
  return (
    <div className="rounded-xl border bg-card p-6 shadow-card">
      <span className="grid size-11 place-items-center rounded-xl bg-accent text-primary"><Wallet className="size-5" /></span>
      <h2 className="mt-4 text-xl font-semibold">Masuk dengan Phantom</h2>
      <p className="mt-1 text-sm text-muted-foreground">Hubungkan wallet Solana Anda. Aplikasi hanya membaca alamat publik — tidak pernah meminta seed phrase atau private key.</p>

      <div className="mt-5 rounded-lg border bg-background p-4">
        <p className="text-xs text-muted-foreground">Status koneksi</p>
        {!w.ready ? (
          <p className="mt-1 flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" /> Mendeteksi Phantom…</p>
        ) : w.connection_status === "unavailable" ? (
          <div className="mt-1 text-sm">
            <p className="font-medium">Ekstensi Phantom tidak terdeteksi</p>
            <a href={PHANTOM_URL} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-primary hover:underline">
              Pasang Phantom dari situs resmi <ExternalLink className="size-3.5" />
            </a>
          </div>
        ) : w.connection_status === "connected" && w.public_key ? (
          <div className="mt-1">
            <p className="flex items-center gap-2 text-sm font-medium text-success"><Check className="size-4" /> Wallet terhubung</p>
            <p className="mt-1 font-mono text-sm" title={w.public_key}>{shortAddress(w.public_key)}</p>
            <details className="mt-1 text-xs text-muted-foreground"><summary className="cursor-pointer">Lihat alamat lengkap</summary><p className="mt-1 break-all font-mono">{w.public_key}</p></details>
          </div>
        ) : (
          <p className="mt-1 text-sm">{w.connection_status === "connecting" ? "Menunggu persetujuan di Phantom…" : "Belum terhubung"}</p>
        )}
        {w.error && <p className="mt-2 text-sm text-destructive">{w.error}</p>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {w.connection_status === "connected" ? (
          <Button variant="outline" onClick={() => { void w.disconnect(); toast("Wallet diputuskan"); }}><Unplug /> Putuskan koneksi</Button>
        ) : (
          <Button onClick={() => void w.connect()} disabled={!w.ready || w.connection_status === "unavailable" || w.connection_status === "connecting"}>
            {w.connection_status === "connecting" ? <Loader2 className="animate-spin" /> : <Wallet />} Hubungkan Phantom Wallet
          </Button>
        )}
      </div>
      <p className="mt-4 flex gap-2 text-xs text-muted-foreground">
        <ShieldAlert className="size-4 shrink-0" />
        Koneksi wallet belum merupakan autentikasi terverifikasi. Akses dashboard berbasis wallet memerlukan verifikasi tanda tangan di backend, yang belum diterapkan.
      </p>
    </div>
  );
}

function StudentDemoCard() {
  const data = useData(() => listStudents());
  const { loginStudentDemo } = useSession();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const students = data.status === "ready" ? data.data : [];
  const results = useMemo(() => (q.trim() ? students.filter((s) => matchesQuery(q, s.nama, s.nim)) : students), [q, students]);
  const selected = students.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="rounded-xl border bg-card p-6 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <span className="grid size-11 place-items-center rounded-xl bg-accent text-primary"><GraduationCap className="size-5" /></span>
        <DemoBadge />
      </div>
      <h2 className="mt-4 text-xl font-semibold">Login Mahasiswa Demo</h2>
      <p className="mt-1 text-sm text-muted-foreground">Jelajahi dashboard mahasiswa menggunakan data demonstrasi.</p>

      <Label htmlFor="student-search" className="mt-5 block">Cari nama atau NIM</Label>
      <div className="relative mt-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input id="student-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="mis. Siti atau DEMO24003" className="h-10 pl-9" autoComplete="off" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {q.trim() ? `${results.length} hasil` : "Ketik nama atau NIM untuk menyaring, atau pilih langsung dari daftar."}
      </p>

      <div role="listbox" aria-label="Daftar mahasiswa demo" className="mt-2 max-h-56 overflow-y-auto rounded-lg border">
        {data.status === "loading" && <div className="space-y-2 p-3">{[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)}</div>}
        {data.status === "error" && <p className="p-4 text-sm text-destructive">{data.error}</p>}
        {data.status === "ready" && results.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">Mahasiswa tidak ditemukan</p>}
        {results.map((s) => (
          <button key={s.id} type="button" role="option" aria-selected={s.id === selectedId} onClick={() => setSelectedId(s.id)}
            className={cn("flex w-full items-center justify-between gap-3 border-b px-3 py-2.5 text-left text-sm last:border-b-0 hover:bg-muted", s.id === selectedId && "bg-accent")}>
            <span><span className="font-medium">{s.nama}</span><span className="block text-xs text-muted-foreground">{s.program_studi}</span></span>
            <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">{s.nim}{s.id === selectedId && <Check className="size-4 text-primary" />}</span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-4 rounded-lg border bg-background p-3 text-sm">
          <p className="text-xs text-muted-foreground">Mahasiswa terpilih</p>
          <p className="font-medium">{selected.nama}</p>
          <p className="text-muted-foreground">{selected.nim} · {selected.program_studi}</p>
        </div>
      )}

      <Button className="mt-4 w-full" disabled={!selected}
        onClick={() => {
          if (!selected) return;
          loginStudentDemo(selected.id, selected.nama);
          toast.success(`Masuk sebagai ${selected.nama} (demo)`);
          navigate({ to: "/student" });
        }}>
        <LogIn /> Masuk sebagai Mahasiswa Demo
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">Simulasi untuk presentasi — bukan autentikasi aman untuk data akademik asli.</p>
    </div>
  );
}

function AdminDemoCard() {
  const { loginAdmin } = useSession();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <form
      className="mt-6 flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-card md:flex-row md:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        if (loginAdmin(code)) {
          toast.success("Masuk sebagai Admin Demo");
          navigate({ to: "/admin" });
        } else setErr("Kode akses salah");
      }}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2"><UserCog className="size-5 text-primary" /><h2 className="font-semibold">Admin Demo</h2><DemoBadge /></div>
        <p className="mt-1 text-sm text-muted-foreground">
          Kode akses demo: <span className="font-mono text-foreground">{DEMO_ADMIN_CODE}</span>. Proteksi ini belum siap untuk produksi.
        </p>
      </div>
      <div className="md:w-64">
        <Label htmlFor="admin-code">Kode akses</Label>
        <Input id="admin-code" className="mt-2" value={code} onChange={(e) => { setCode(e.target.value); setErr(null); }} aria-invalid={!!err} />
        {err && <p className="mt-1 text-sm text-destructive">{err}</p>}
      </div>
      <Button type="submit"><LogIn /> Masuk sebagai Admin</Button>
    </form>
  );
}
