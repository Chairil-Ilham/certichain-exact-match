import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/app/bits";
import { listActivity } from "@/lib/store";
import { useData } from "@/lib/use-data";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/admin/activity")({ component: ActivityPage });

function ActivityPage() {
  const act = useData(() => listActivity());
  return (
    <div>
      <PageHeader title="Riwayat Aktivitas" description="Dicatat di data demo browser ini." />
      {act.status === "loading" && <div className="h-48 animate-pulse rounded-xl bg-muted" />}
      {act.status === "ready" && act.data.length === 0 && <EmptyState Icon={Activity} title="Belum ada aktivitas" />}
      {act.status === "ready" && act.data.length > 0 && (
        <ol className="divide-y rounded-xl border bg-card shadow-card">
          {act.data.map((a) => (
            <li key={a.id} className="flex flex-col gap-1 px-5 py-3 text-sm sm:flex-row sm:justify-between">
              <span><span className="font-medium">{a.actor}</span> — {a.action}</span>
              <span className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
