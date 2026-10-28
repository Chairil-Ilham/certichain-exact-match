export type CertificateStatus = "valid" | "revoked";

/** Where a record comes from. "blockchain" is reserved for real, verified on-chain checks (not implemented yet). */
export type DataSource = "demo" | "database" | "blockchain";

export interface Student {
  id: string;
  nama: string;
  nim: string;
  program_studi: string;
  mode_demo: boolean;
  created_at: string;
}

export interface Certificate {
  id: string;
  verification_code: string;
  student_id: string;
  certificate_name: string;
  institution: string;
  issue_date: string; // YYYY-MM-DD
  description: string;
  status: CertificateStatus;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  actor: string;
  action: string;
  target_type: "certificate" | "student" | "session";
  target_id: string;
  created_at: string;
}

export type WalletConnectionStatus = "unavailable" | "disconnected" | "connecting" | "connected";

export interface WalletState {
  public_key: string | null;
  connection_status: WalletConnectionStatus;
  connected_at: string | null;
  /** Always false until a backend challenge/signature flow exists. */
  backend_authenticated: false;
}

export type Session =
  | { kind: "admin"; name: string; started_at: string }
  | { kind: "student-demo"; student_id: string; started_at: string };

export type VerifyResult =
  | { state: "valid" | "revoked"; certificate: Certificate; student: Student; source: DataSource }
  | { state: "not_found" }
  | { state: "error"; message: string };
