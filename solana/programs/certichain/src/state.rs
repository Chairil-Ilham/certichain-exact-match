use anchor_lang::prelude::*;

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
    pub certificate_seed: [u8; 32],
}
impl CertificateRecord { pub const SPACE: usize = 8 + 32 + 32 + 8 + 1 + 1 + 32; }