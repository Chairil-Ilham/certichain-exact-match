import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LayoutDashboard, LogIn, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./bits";
import { WalletChip } from "./wallet-chip";
import { useSession } from "@/providers/session";

const NAV = [
  { to: "/", label: "Beranda" },
  { to: "/verify", label: "Verifikasi Sertifikat" },
  { to: "/about", label: "Tentang" },
] as const;

function SessionButton() {
  const { session } = useSession();
  if (session?.kind === "admin")
    return <Button asChild size="sm"><Link to="/admin"><LayoutDashboard /> Dashboard</Link></Button>;
  if (session?.kind === "student-demo")
    return <Button asChild size="sm"><Link to="/student"><LayoutDashboard /> Dashboard</Link></Button>;
  return <Button asChild size="sm"><Link to="/login"><LogIn /> Login</Link></Button>;
}

export function PublicLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: true }}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                activeProps={{ className: "text-foreground font-medium" }}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex"><WalletChip /></span>
            <span className="hidden md:inline-flex"><SessionButton /></span>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Buka menu"><Menu /></Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader><SheetTitle>Menu</SheetTitle></SheetHeader>
                <nav className="mt-4 flex flex-col gap-1 px-4" aria-label="Navigasi mobile">
                  {NAV.map((n) => (
                    <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm hover:bg-muted">{n.label}</Link>
                  ))}
                  <div className="mt-3 flex flex-col gap-3" onClick={() => setOpen(false)}>
                    <WalletChip />
                    <SessionButton />
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm sm:grid-cols-3">
          <div>
            <Logo />
            <p className="mt-3 text-muted-foreground">Prototype akademik platform verifikasi sertifikat.</p>
          </div>
          <nav className="flex flex-col gap-2" aria-label="Footer">
            {NAV.map((n) => <Link key={n.to} to={n.to} className="text-muted-foreground hover:text-foreground">{n.label}</Link>)}
            <Link to="/login" className="text-muted-foreground hover:text-foreground">Login</Link>
          </nav>
          <p className="text-muted-foreground">
            Seluruh nama, NIM, dan sertifikat pada versi ini adalah data demonstrasi sintetis. Belum ada pencatatan on-chain.
          </p>
        </div>
      </footer>
    </div>
  );
}
