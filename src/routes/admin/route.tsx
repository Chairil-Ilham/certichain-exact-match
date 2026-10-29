import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Activity, FilePlus2, FileText, LayoutGrid, Loader2, Settings, Users } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/app/dashboard-shell";
import { DemoBadge } from "@/components/app/bits";
import { readSession } from "@/providers/session";

const NAV: NavItem[] = [
  { to: "/admin", label: "Ringkasan", Icon: LayoutGrid, exact: true },
  { to: "/admin/certificates", label: "Data Sertifikat", Icon: FileText, exact: true },
  { to: "/admin/certificates/new", label: "Tambah Sertifikat", Icon: FilePlus2 },
  { to: "/admin/students", label: "Data Mahasiswa", Icon: Users },
  { to: "/admin/activity", label: "Riwayat Aktivitas", Icon: Activity },
  { to: "/admin/settings", label: "Pengaturan", Icon: Settings },
];

export const ADMIN_ACTOR = "Admin Demo";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: () => {
    const s = readSession();
    if (!s) throw redirect({ to: "/login" });
    if (s.kind !== "admin") throw redirect({ to: "/access-denied" });
  },
  head: () => ({ meta: [{ title: "Dashboard Admin — CertiChain" }, { name: "robots", content: "noindex" }] }),
  pendingComponent: () => <div className="grid min-h-screen place-items-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>,
  component: () => (
    <DashboardShell items={NAV} title="Admin" headerExtra={<><DemoBadge /><span className="hidden text-sm font-medium md:inline">Admin Demo</span></>}>
      <Outlet />
    </DashboardShell>
  ),
});
