import { createFileRoute } from "@tanstack/react-router";
import { DemoBadge, PageHeader } from "@/components/app/bits";
import { getStudent } from "@/lib/store";
import { useData } from "@/lib/use-data";
import { useWallet } from "@/providers/wallet";
import { formatDateTime, shortAddress } from "@/lib/format";
import { useSession } from "@/providers/session";
import { useCurrentStudentId } from "@/lib/session-helpers";

export const Route = createFileRoute("/student/profile")({ component: Profile });

function Profile() {
  const id = useCurrentStudentId();
  const st = useData(() => getStudent(id), [id]);
  const w = useWallet();
  const { session } = useSession();
  return (
    <div>
      <PageHeader title="Profil" />
      {st.status !== "ready" ? <div className="h-48 animate-pulse rounded-xl bg-muted" /> : st.data && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between"><h2 className="font-semibold">Identitas</h2><DemoBadge /></div>
            <dl className="mt-4 space-y-3 text-sm">
              <Row l="Nama" v={st.data.nama} />
              <Row l="NIM" v={<span className="font-mono">{st.data.nim}</span>} />
              <Row l="Program studi" v={st.data.program_studi} />
              <Row l="ID internal" v={<span className="font-mono">{st.data.id}</span>} />
              {session && <Row l="Sesi dimulai" v={formatDateTime(session.started_at)} />}
            </dl>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-card">
            <h2 className="font-semibold">Status sesi</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Row l="Jenis sesi" v="Mahasiswa demo (simulasi)" />
              <Row l="Wallet" v={w.public_key ? `Terhubung ${shortAddress(w.public_key)}` : "Tidak terhubung"} />
              <Row l="Autentikasi wallet" v="Tidak — wallet tidak mengautentikasi akun ini" />
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ l, v }: { l: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-4 border-b pb-2 last:border-0"><dt className="text-muted-foreground">{l}</dt><dd className="text-right font-medium">{v}</dd></div>;
}
