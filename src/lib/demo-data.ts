import type { Activity, Certificate, Student } from "./types";

// All identities below are SYNTHETIC demo data. They do not represent real students.
export const DEMO_STUDENTS: Student[] = [
  { id: "stu-001", nama: "Andi Pratama", nim: "DEMO24001", program_studi: "Informatika", mode_demo: true, created_at: "2026-01-10T08:00:00Z" },
  { id: "stu-002", nama: "Siti Rahma", nim: "DEMO24002", program_studi: "Sistem Informasi", mode_demo: true, created_at: "2026-01-10T08:00:00Z" },
  { id: "stu-003", nama: "Budi Santoso", nim: "DEMO24003", program_studi: "Teknik Komputer", mode_demo: true, created_at: "2026-01-10T08:00:00Z" },
  { id: "stu-004", nama: "Nadia Putri", nim: "DEMO24004", program_studi: "Informatika", mode_demo: true, created_at: "2026-01-10T08:00:00Z" },
  { id: "stu-005", nama: "Rizky Maulana", nim: "DEMO24005", program_studi: "Sistem Informasi", mode_demo: true, created_at: "2026-01-10T08:00:00Z" },
  { id: "stu-006", nama: "Dewi Lestari", nim: "DEMO24006", program_studi: "Teknik Komputer", mode_demo: true, created_at: "2026-01-10T08:00:00Z" },
];

const c = (
  id: string, code: string, student_id: string, certificate_name: string, institution: string,
  issue_date: string, description: string, status: Certificate["status"] = "valid",
): Certificate => ({
  id, verification_code: code, student_id, certificate_name, institution, issue_date, description, status,
  created_at: `${issue_date}T09:00:00Z`, updated_at: `${issue_date}T09:00:00Z`,
});

export const DEMO_CERTIFICATES: Certificate[] = [
  c("cert-001", "CC-7KQ2-M9XA", "stu-001", "Juara 1 Lomba Pemrograman", "Universitas Demo", "2026-03-14", "Kompetisi pemrograman tingkat fakultas."),
  c("cert-002", "CC-3HTP-W4LZ", "stu-001", "Sertifikat Kompetensi Web Development", "Lembaga Sertifikasi Demo", "2026-05-02", "Pelatihan 40 jam pengembangan web."),
  c("cert-003", "CC-8RNE-D2VC", "stu-002", "Asisten Laboratorium Basis Data", "Universitas Demo", "2026-02-20", "Asisten praktikum semester genap."),
  c("cert-004", "CC-5JUY-B7QS", "stu-002", "Seminar Nasional Sistem Informasi", "Himpunan Mahasiswa Demo", "2026-04-11", "Peserta seminar nasional."),
  c("cert-005", "CC-2GFM-K6PT", "stu-003", "Workshop Internet of Things", "Universitas Demo", "2026-01-28", "Workshop perancangan perangkat IoT.", "revoked"),
  c("cert-006", "CC-9WLA-H3NR", "stu-003", "Sertifikat Jaringan Komputer Dasar", "Lembaga Sertifikasi Demo", "2026-06-07", "Pelatihan dasar jaringan."),
  c("cert-007", "CC-4ZDX-T8EM", "stu-004", "Finalis Hackathon Kampus", "Universitas Demo", "2026-05-19", "Finalis hackathon 48 jam."),
  c("cert-008", "CC-6PBC-R1YU", "stu-005", "Pelatihan Analisis Data", "Lembaga Sertifikasi Demo", "2026-03-30", "Pelatihan analisis data dengan spreadsheet dan SQL."),
  c("cert-009", "CC-1VSK-N5JG", "stu-005", "Panitia Dies Natalis", "Universitas Demo", "2026-07-15", "Anggota kepanitiaan.", "revoked"),
];

export const DEMO_ACTIVITY: Activity[] = [
  { id: "act-001", actor: "Sistem (seed demo)", action: "Memuat data demonstrasi", target_type: "session", target_id: "-", created_at: "2026-01-10T08:00:00Z" },
];
