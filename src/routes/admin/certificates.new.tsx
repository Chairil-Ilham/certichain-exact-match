import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/bits";
import { CertificateForm } from "@/components/app/certificate-form";
import { createCertificate } from "@/lib/store";
import { ADMIN_ACTOR } from "@/lib/session-helpers";

export const Route = createFileRoute("/admin/certificates/new")({ component: NewCert });

function NewCert() {
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl">
      <PageHeader title="Tambah Sertifikat" description="Data divalidasi di form dan di lapisan service sebelum disimpan." />
      <CertificateForm onSubmit={async (v) => {
        const c = await createCertificate(v, ADMIN_ACTOR);
        toast.success("Sertifikat disimpan", { description: c.verification_code });
        navigate({ to: "/admin/certificates" });
      }} />
    </div>
  );
}
