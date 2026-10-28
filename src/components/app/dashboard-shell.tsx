import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./bits";
import { WalletChip } from "./wallet-chip";
import { useSession } from "@/providers/session";

export interface NavItem { to: string; label: string; Icon: LucideIcon; exact?: boolean }

function NavList({ items, onNavigate, onLogout }: { items: NavItem[]; onNavigate?: () => void; onLogout: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Navigasi dashboard">
      {items.map(({ to, label, Icon, exact }) => (
        <Link key={to} to={to} onClick={onNavigate} activeOptions={{ exact: !!exact }}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium" }}>
          <Icon className="size-4" aria-hidden /> {label}
        </Link>
      ))}
      <button type="button" onClick={onLogout}
        className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground hover:bg-destructive-soft hover:text-destructive">
        <LogOut className="size-4" aria-hidden /> Logout
      </button>
    </nav>
  );
}

export function DashboardShell({ items, title, headerExtra, children }: { items: NavItem[]; title: string; headerExtra?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { logout } = useSession();
  const navigate = useNavigate();
  const doLogout = () => {
    logout();
    navigate({ to: "/login", replace: true });
  };
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r bg-sidebar p-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:gap-6">
        <Logo />
        <p className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
        <NavList items={items} onLogout={doLogout} />
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Buka menu"><Menu /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-72 flex-col p-4">
                <SheetHeader className="p-0"><SheetTitle>{title}</SheetTitle></SheetHeader>
                <NavList items={items} onNavigate={() => setOpen(false)} onLogout={doLogout} />
              </SheetContent>
            </Sheet>
            <span className="lg:hidden"><Logo /></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex"><WalletChip /></span>
            {headerExtra}
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
