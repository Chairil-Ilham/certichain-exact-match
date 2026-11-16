use std::{env, fs, path::PathBuf};
fn main() {
    println!("cargo:rerun-if-env-changed=CERTICHAIN_PROGRAM_ID");
    let issuer_path = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap()).join("../../../config/issuer.json");
    println!("cargo:rerun-if-changed={}", issuer_path.display());
    let config: serde_json::Value = serde_json::from_str(&fs::read_to_string(issuer_path).expect("Issuer configuration required")).expect("Invalid issuer configuration");
    let issuer = config["publicAddress"].as_str().expect("Candidate issuer public address required");
    let id = env::var("CERTICHAIN_PROGRAM_ID").expect("Set CERTICHAIN_PROGRAM_ID from the real deployment keypair. No placeholder ID is provided.");
    assert!(id.len() >= 32 && id.len() <= 44 && id.chars().all(|c| "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz".contains(c)), "Invalid base58 program ID");
    let path = PathBuf::from(env::var("OUT_DIR").unwrap()).join("program_id.rs");
    fs::write(path, format!("anchor_lang::declare_id!(\"{}\");\npub const CANDIDATE_ISSUER: anchor_lang::prelude::Pubkey = anchor_lang::pubkey!(\"{}\");", id, issuer)).unwrap();
}