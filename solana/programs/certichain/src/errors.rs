use anchor_lang::prelude::*;

#[error_code]
pub enum CertiChainError {
    #[msg("Penerbit tidak berwenang")] Unauthorized,
    #[msg("Hash tidak cocok")] HashMismatch,
    #[msg("Sertifikat dicabut")] Revoked,
    #[msg("Sertifikat sudah dicabut")] AlreadyRevoked,
    #[msg("Identifier sertifikat tidak cocok")] IdentifierMismatch,
}