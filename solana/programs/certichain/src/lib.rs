use anchor_lang::prelude::*;
include!(concat!(env!("OUT_DIR"), "/program_id.rs"));

#[program]
pub mod certichain {
    use super::*;

    // Initialization is restricted to the deployed program's upgrade authority,
    // not whichever wallet calls first.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.config.authority = ctx.accounts.authority.key();
        ctx.accounts.config.bump = ctx.bumps.config;
        Ok(())
    }
    pub fn simpan_sertifikat(ctx: Context<SimpanSertifikat>, _certificate_seed: [u8; 32], certificate_hash: [u8; 32]) -> Result<()> {
        let record = &mut ctx.accounts.record;
        record.certificate_hash = certificate_hash;
        record.issuer = ctx.accounts.issuer.key();
        record.created_at = Clock::get()?.unix_timestamp;
        record.revoked = false;
        record.bump = ctx.bumps.record;
        Ok(())
    }
    pub fn verifikasi_sertifikat(ctx: Context<VerifikasiSertifikat>, _certificate_seed: [u8; 32], expected_hash: [u8; 32]) -> Result<()> {
        require!(!ctx.accounts.record.revoked, CertiChainError::Revoked);
        require!(ctx.accounts.record.certificate_hash == expected_hash, CertiChainError::HashMismatch);
        Ok(())
    }
    pub fn cabut_sertifikat(ctx: Context<CabutSertifikat>, _certificate_seed: [u8; 32]) -> Result<()> {
        require!(!ctx.accounts.record.revoked, CertiChainError::AlreadyRevoked);
        ctx.accounts.record.revoked = true;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut, address = CANDIDATE_ISSUER @ CertiChainError::Unauthorized)]
    pub authority: Signer<'info>,
    #[account(init, payer = authority, space = Config::SPACE, seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,
    #[account(constraint = program.programdata_address()? == Some(program_data.key()) @ CertiChainError::Unauthorized)]
    pub program: Program<'info, crate::program::Certichain>,
    #[account(constraint = program_data.upgrade_authority_address == Some(authority.key()) @ CertiChainError::Unauthorized)]
    pub program_data: Account<'info, ProgramData>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
#[instruction(certificate_seed: [u8; 32])]
pub struct SimpanSertifikat<'info> {
    #[account(mut, address = CANDIDATE_ISSUER @ CertiChainError::Unauthorized)]
    pub issuer: Signer<'info>,
    #[account(seeds = [b"config"], bump = config.bump, constraint = config.authority == issuer.key() @ CertiChainError::Unauthorized)]
    pub config: Account<'info, Config>,
    #[account(init, payer = issuer, space = CertificateRecord::SPACE, seeds = [b"certificate", certificate_seed.as_ref()], bump)]
    pub record: Account<'info, CertificateRecord>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
#[instruction(certificate_seed: [u8; 32])]
pub struct VerifikasiSertifikat<'info> {
    #[account(seeds = [b"certificate", certificate_seed.as_ref()], bump = record.bump)]
    pub record: Account<'info, CertificateRecord>,
}
#[derive(Accounts)]
#[instruction(certificate_seed: [u8; 32])]
pub struct CabutSertifikat<'info> {
    #[account(address = CANDIDATE_ISSUER @ CertiChainError::Unauthorized)]
    pub issuer: Signer<'info>,
    #[account(seeds = [b"config"], bump = config.bump, constraint = config.authority == issuer.key() @ CertiChainError::Unauthorized)]
    pub config: Account<'info, Config>,
    #[account(mut, seeds = [b"certificate", certificate_seed.as_ref()], bump = record.bump, has_one = issuer @ CertiChainError::Unauthorized)]
    pub record: Account<'info, CertificateRecord>,
}
#[account]
pub struct Config { pub authority: Pubkey, pub bump: u8 }
impl Config { pub const SPACE: usize = 8 + 32 + 1; }
#[account]
pub struct CertificateRecord {
    pub certificate_hash: [u8; 32],
    pub issuer: Pubkey,
    pub created_at: i64,
    pub revoked: bool,
    pub bump: u8,
}
impl CertificateRecord { pub const SPACE: usize = 8 + 32 + 32 + 8 + 1 + 1; }
#[error_code]
pub enum CertiChainError {
    #[msg("Penerbit tidak berwenang")] Unauthorized,
    #[msg("Hash tidak cocok")] HashMismatch,
    #[msg("Sertifikat dicabut")] Revoked,
    #[msg("Sertifikat sudah dicabut")] AlreadyRevoked,
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn issuer_matches_official_candidate() {
        assert_eq!(CANDIDATE_ISSUER.to_string(), "DUPoMPmu5Hbsh1RNHuc2VMV3GVCZkj8ZEZbybk5fRh4k");
        assert_ne!(CANDIDATE_ISSUER, Pubkey::new_unique());
    }
    #[test] fn record_space_is_exact() { assert_eq!(CertificateRecord::SPACE, 82); assert_eq!(Config::SPACE, 41); }
    #[test] fn pda_is_stable_and_id_specific() {
        let a = Pubkey::find_program_address(&[b"certificate", &[1; 32]], &crate::ID);
        assert_eq!(a, Pubkey::find_program_address(&[b"certificate", &[1; 32]], &crate::ID));
        assert_ne!(a.0, Pubkey::find_program_address(&[b"certificate", &[2; 32]], &crate::ID).0);
    }
}