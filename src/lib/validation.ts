import { z } from "zod";

const isValidDate = (v: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};

export const certificateFormSchema = z.object({
  student_id: z.string().min(1, "Pilih mahasiswa"),
  certificate_name: z.string().trim().min(3, "Nama sertifikat minimal 3 karakter").max(120, "Maksimal 120 karakter"),
  institution: z.string().trim().min(2, "Institusi wajib diisi").max(120, "Maksimal 120 karakter"),
  issue_date: z.string().refine(isValidDate, "Tanggal tidak valid"),
  description: z.string().trim().max(500, "Maksimal 500 karakter").optional().default(""),
  verification_code: z.string().regex(/^CC-[A-Z0-9]{4}-[A-Z0-9]{4}$/, "Format kode tidak valid"),
});

export type CertificateFormInput = z.infer<typeof certificateFormSchema>;

export const studentFormSchema = z.object({
  nama: z.string().trim().min(3, "Nama minimal 3 karakter").max(80),
  nim: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{5,15}$/, "NIM 5–15 karakter huruf/angka"),
  program_studi: z.string().trim().min(2, "Program studi wajib diisi").max(80),
});

export function normalizeCode(raw: string) {
  return raw.trim().toUpperCase();
}
