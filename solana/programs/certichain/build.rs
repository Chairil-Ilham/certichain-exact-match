use std::{env, fs, path::PathBuf};
fn main() {
    println!("cargo:rerun-if-env-changed=CERTICHAIN_PROGRAM_ID");
    let id = env::var("CERTICHAIN_PROGRAM_ID").expect("Set CERTICHAIN_PROGRAM_ID from the real deployment keypair. No placeholder ID is provided.");
    assert!(id.len() >= 32 && id.len() <= 44 && id.chars().all(|c| "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz".contains(c)), "Invalid base58 program ID");
    let path = PathBuf::from(env::var("OUT_DIR").unwrap()).join("program_id.rs");
    fs::write(path, format!("anchor_lang::declare_id!(\"{}\");", id)).unwrap();
}