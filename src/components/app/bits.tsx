import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, Ban, Check, Copy, Database, FlaskConical, Info, ShieldCheck, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { CertificateStatus, DataSource } from "@/lib/types";

export function Logo({ to = "/" as const }: { to?: "/" }) {
  return (
    <Link to={to} className="flex items-center gap-2 font-bold tracking-tight text-foreground">
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <ShieldCheck className="size-4" />
      </span>
      CertiChain
    </Link>
  );
}

export function StatusBadge({ status }: { status: CertificateStatus }) {
  return status === "valid" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success">
      <BadgeCheck className="size-3.5" aria-hidden /> Valid
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-destructive-soft px-2.5 py-0.5 text-xs font-medium text-destructive">
      <Ban className="size-3.5" aria-hidden /> Dicabut
    </span>
  );
}

export function SourceBadge({ source }: { source: DataSource }) {
  const map: Record<DataSource, { label: string; Icon: LucideIcon }> = {
    demo: { label: "Demo", Icon: FlaskConical },
    database: { label: "Database", Icon: Database },
    blockchain: { label: "Blockchain terverifikasi", Icon: ShieldCheck },
  };
  const { label, Icon } = map[source];
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      <Icon className="size-3.5" aria-hidden /> Sumber: {label}
    </span>
  );
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-warning">
      <FlaskConical className="size-3.5" aria-hidden /> Mode Demo
    </span>
  );
}

export function PrototypeNotice({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start gap-2 rounded-lg border bg-accent/60 px-3 py-2.5 text-sm text-accent-foreground", className)}>
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{children ?? "Prototype — verifikasi berdasarkan database/demo. Data disimpan di browser ini (localStorage), bukan di blockchain."}</p>
    </div>
  );
}

export function CopyButton({ value, label = "Salin kode" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      type="button" variant="outline" size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          toast.success("Kode disalin", { description: value });
          setTimeout(() => setDone(false), 1500);
        } catch {
          toast.error("Gagal menyalin kode");
        }
      }}
    >
      {done ? <Check /> : <Copy />} {label}
    </Button>
  );
}

export function StatCard({ label, value, Icon, tone = "default" }: { label: string; value: ReactNode; Icon: LucideIcon; tone?: "default" | "success" | "destructive" }) {
  const toneCls = { default: "bg-accent text-primary", success: "bg-success-soft text-success", destructive: "bg-destructive-soft text-destructive" }[tone];
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={cn("grid size-9 place-items-center rounded-lg", toneCls)}><Icon className="size-4" aria-hidden /></span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export function EmptyState({ Icon, title, children }: { Icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed bg-card px-6 py-12 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground"><Icon className="size-5" aria-hidden /></span>
      <p className="mt-3 font-medium">{title}</p>
      {children && <div className="mt-1 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel, destructive, onConfirm,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description: ReactNode;
  confirmLabel: string; destructive?: boolean; onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild><div>{description}</div></AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
