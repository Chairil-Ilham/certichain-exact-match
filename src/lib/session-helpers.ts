import { readSession, useSession } from "@/providers/session";

export const ADMIN_ACTOR = "Admin Demo";

export function useCurrentStudentId() {
  const { session } = useSession();
  if (session?.kind === "student-demo") return session.student_id;
  const s = readSession();
  return s?.kind === "student-demo" ? s.student_id : "";
}
