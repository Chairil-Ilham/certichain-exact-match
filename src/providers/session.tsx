import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@/lib/types";
import { logSession } from "@/lib/store";

/**
 * Prototype session (localStorage). NOT production-grade authentication:
 * anyone with browser access can alter it. Replace with real backend auth before using real data.
 */
const KEY = "certichain.session.v1";
/** Demo-only admin access code, shown openly on the login page. */
export const DEMO_ADMIN_CODE = "admin-demo";

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

interface SessionCtx {
  session: Session | null;
  hydrated: boolean;
  loginAdmin: (code: string) => boolean;
  loginStudentDemo: (studentId: string, label: string) => void;
  logout: () => void;
}

const Ctx = createContext<SessionCtx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSession(readSession());
    setHydrated(true);
    const onStorage = (e: StorageEvent) => e.key === KEY && setSession(readSession());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const write = (s: Session | null) => {
    if (s) window.localStorage.setItem(KEY, JSON.stringify(s));
    else window.localStorage.removeItem(KEY);
    setSession(s);
  };

  const loginAdmin = useCallback((code: string) => {
    if (code.trim() !== DEMO_ADMIN_CODE) return false;
    write({ kind: "admin", name: "Admin Demo", started_at: new Date().toISOString() }); // replaces any student session
    logSession("Admin Demo", "Masuk ke dashboard admin");
    return true;
  }, []);

  const loginStudentDemo = useCallback((studentId: string, label: string) => {
    write({ kind: "student-demo", student_id: studentId, started_at: new Date().toISOString() });
    logSession(label, "Masuk sebagai mahasiswa demo");
  }, []);

  const logout = useCallback(() => write(null), []);

  const value = useMemo(() => ({ session, hydrated, loginAdmin, loginStudentDemo, logout }), [session, hydrated, loginAdmin, loginStudentDemo, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession must be used within SessionProvider");
  return v;
}
