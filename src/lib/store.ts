/**
 * Demo data service. Data lives in browser localStorage only — NOT a permanent
 * database. Every function is async so it can later be swapped for a real API.
 */
import { DEMO_ACTIVITY, DEMO_CERTIFICATES, DEMO_STUDENTS } from "./demo-data";
import type { Activity, Certificate, Student, VerifyResult } from "./types";
import { certificateFormSchema, normalizeCode, studentFormSchema, type CertificateFormInput } from "./validation";

const KEY = "certichain.demo-db.v1";

interface DB {
  students: Student[];
  certificates: Certificate[];
  activity: Activity[];
}

const seed = (): DB => ({
  students: structuredClone(DEMO_STUDENTS),
  certificates: structuredClone(DEMO_CERTIFICATES),
  activity: structuredClone(DEMO_ACTIVITY),
});

let db: DB | null = null;
const listeners = new Set<() => void>();
let version = 0;

function load(): DB {
  if (db) return db;
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(KEY);
    db = raw ? (JSON.parse(raw) as DB) : seed();
  } catch {
    db = seed();
  }
  return db;
}

function save() {
  if (typeof window !== "undefined" && db) window.localStorage.setItem(KEY, JSON.stringify(db));
  version++;
  listeners.forEach((l) => l());
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
export const getVersion = () => version;

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 10)}`;

function log(actor: string, action: string, target_type: Activity["target_type"], target_id: string) {
  load().activity.unshift({ id: uid("act"), actor, action, target_type, target_id, created_at: new Date().toISOString() });
}

export function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const existing = new Set(load().certificates.map((c) => c.verification_code));
  let code = `CC-${part()}-${part()}`;
  while (existing.has(code)) code = `CC-${part()}-${part()}`;
  return code;
}

export async function listStudents() {
  await delay(150);
  return [...load().students];
}
export function listStudentsSync() {
  return [...load().students];
}
export async function getStudent(id: string) {
  await delay(100);
  return load().students.find((s) => s.id === id) ?? null;
}

export async function listCertificates() {
  await delay();
  return [...load().certificates];
}
export async function listCertificatesForStudent(studentId: string) {
  await delay();
  return load().certificates.filter((c) => c.student_id === studentId);
}
export async function getCertificateByCode(code: string) {
  await delay(150);
  const d = load();
  const cert = d.certificates.find((c) => c.verification_code === normalizeCode(code));
  if (!cert) return null;
  return { certificate: cert, student: d.students.find((s) => s.id === cert.student_id) ?? null };
}
export async function listActivity() {
  await delay(150);
  return [...load().activity];
}

export async function verifyCode(raw: string): Promise<VerifyResult> {
  try {
    await delay(400);
    const code = normalizeCode(raw);
    const d = load();
    const cert = d.certificates.find((c) => c.verification_code === code); // exact match
    if (!cert) return { state: "not_found" };
    const student = d.students.find((s) => s.id === cert.student_id);
    if (!student) return { state: "error", message: "Data penerima tidak konsisten." };
    return { state: cert.status, certificate: cert, student, source: "demo" };
  } catch {
    return { state: "error", message: "Sistem verifikasi sedang tidak dapat diakses." };
  }
}

export async function createCertificate(input: CertificateFormInput, actor: string) {
  await delay();
  const parsed = certificateFormSchema.parse(input); // service-side validation
  const d = load();
  if (!d.students.some((s) => s.id === parsed.student_id)) throw new Error("Mahasiswa tidak ditemukan");
  if (d.certificates.some((c) => c.verification_code === parsed.verification_code)) throw new Error("Kode verifikasi sudah digunakan");
  const now = new Date().toISOString();
  const cert: Certificate = { id: uid("cert"), ...parsed, description: parsed.description ?? "", status: "valid", created_at: now, updated_at: now };
  d.certificates.unshift(cert);
  log(actor, `Menambahkan sertifikat ${cert.verification_code}`, "certificate", cert.id);
  save();
  return cert;
}

export async function updateCertificate(id: string, input: CertificateFormInput, actor: string) {
  await delay();
  const parsed = certificateFormSchema.parse(input);
  const d = load();
  const cert = d.certificates.find((c) => c.id === id);
  if (!cert) throw new Error("Sertifikat tidak ditemukan");
  if (cert.status === "revoked") throw new Error("Sertifikat yang dicabut tidak dapat diubah");
  Object.assign(cert, { ...parsed, verification_code: cert.verification_code, updated_at: new Date().toISOString() });
  log(actor, `Mengubah sertifikat ${cert.verification_code}`, "certificate", cert.id);
  save();
  return cert;
}

export async function revokeCertificate(id: string, actor: string) {
  await delay();
  const cert = load().certificates.find((c) => c.id === id);
  if (!cert) throw new Error("Sertifikat tidak ditemukan");
  cert.status = "revoked";
  cert.updated_at = new Date().toISOString();
  log(actor, `Mencabut sertifikat ${cert.verification_code}`, "certificate", cert.id);
  save();
}

export async function createStudent(input: { nama: string; nim: string; program_studi: string }, actor: string) {
  await delay();
  const parsed = studentFormSchema.parse(input);
  const d = load();
  if (d.students.some((s) => s.nim === parsed.nim)) throw new Error("NIM sudah terdaftar");
  const s: Student = { id: uid("stu"), ...parsed, mode_demo: true, created_at: new Date().toISOString() };
  d.students.push(s);
  log(actor, `Menambahkan mahasiswa ${s.nim}`, "student", s.id);
  save();
  return s;
}

export function logSession(actor: string, action: string) {
  load();
  log(actor, action, "session", "-");
  save();
}

export async function resetDemoData() {
  await delay();
  db = seed();
  save();
}
