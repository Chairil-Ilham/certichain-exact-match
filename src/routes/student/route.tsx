import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { FileText, LayoutGrid, Loader2, UserRound } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/app/dashboard-shell";
import { DemoBadge } from "@/components/app/bits";
import { readSession, useSession } from "@/providers/session";
import { getStudent } from "@/lib/store";
import { useData } from "@/lib/use-data";

const NAV: NavItem[] = [
  { to: "/student", label: "Ringkasan", Icon: LayoutGrid, exact: true },
  { to: "/student/certificates", label: "Sertifikat Saya", Icon: FileText },
  { to: "/student/profile", label: "Profil", Icon: UserRound },
];

export const Route = createFileRoute("/student")({
  ssr: false,
  beforeLoad: () => {
    const s = readSession();
    if (!s) throw redirect({ to: "/login" });
    if (s.kind !== "student-demo") throw redirect({ to: "/access-denied" });
  },
  head: () => ({ meta: [{ title: "Dashboard Mahasiswa — CertiChain" }, { name: "robots", content: "noindex" }] }),
  pendingComponent: () => <div className="grid min-h-screen place-items-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>,
  component: StudentLayout,
});

export function useCurrentStudentId() {
  const { session } = useSession();
  return session?.kind === "student-demo" ? session.student_id : (readSession() as { student_id?: string } | null)?.student_id ?? "";
}

function StudentLayout() {
  const id = useCurrentStudentId();
  const st = useData(() => getStudent(id), [id]);
  return (
    <DashboardShell items={NAV} title="Mahasiswa" headerExtra={
      <div className="flex items-center gap-2">
        <DemoBadge />
        {st.status === "ready" && st.data && <span className="hidden text-sm font-medium md:inline">{st.data.nama}</span>}
      </div>
    }>
      <Outlet />
    </DashboardShell>
  );
}
