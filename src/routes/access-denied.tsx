import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/app/public-layout";

export const Route = createFileRoute("/access-denied")({
  head: () => ({
    meta: [
      { title: "Akses Ditolak — CertiChain" },
      { name: "description", content: "Anda tidak memiliki akses ke halaman ini." },
      { property: "og:title", content: "Akses Ditolak — CertiChain" },
      { property: "og:description", content: "Anda tidak memiliki akses ke halaman ini." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <PublicLayout>
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-destructive-soft text-destructive"><ShieldX className="size-7" /></span>
        <h1 className="mt-5 text-2xl font-semibold">Akses ditolak</h1>
        <p className="mt-2 text-muted-foreground">Sesi Anda tidak memiliki izin untuk halaman tersebut. Masuk dengan peran yang sesuai.</p>
        <div className="mt-6 flex gap-2">
          <Button asChild><Link to="/login">Ke halaman login</Link></Button>
          <Button asChild variant="outline"><Link to="/">Beranda</Link></Button>
        </div>
      </div>
    </PublicLayout>
  ),
});
