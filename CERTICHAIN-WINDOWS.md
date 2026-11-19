# Panduan Windows: build dan tes sebelum Devnet

**Belum tersedia di preview:** domain HTTPS layanan login, Anchor/Solana CLI, identitas program nyata, wallet issuer lokal dan persetujuan Phantom. Jangan mengunggah private key atau seed phrase. Gunakan WSL Ubuntu di Windows; issuer harus tepat `DUPoMPmu5Hbsh1RNHuc2VMV3GVCZkj8ZEZbybk5fRh4k`, berbeda dari Program ID.

PowerShell administrator:

```powershell
wsl --install -d Ubuntu
```

Restart bila diminta. Di Ubuntu, pasang Rust, Solana/Agave CLI, Anchor **0.31.1**, Node dan Bun melalui panduan resmi. Periksa `rustc --version`, `cargo --version`, `solana --version`, `anchor --version`, `node --version`, `bun --version`. Source proyek harus tersedia di WSL. Wallet signing issuer harus di luar proyek. Untuk hardware wallet/Phantom-only gunakan alur signing lokal kompatibel; jangan mengekspor seed hanya untuk mengikuti skrip.

## 1. Identitas dan build — terminal Ubuntu WSL, root proyek

```bash
bun install
bun add -d @coral-xyz/anchor@0.31.1
read -r -p "Lokasi absolut signing wallet issuer di luar proyek: " ISSUER_KEYPAIR
export ISSUER_KEYPAIR
mkdir -p "$HOME/.local/share/certichain"
export PROGRAM_KEYPAIR="$HOME/.local/share/certichain/program-keypair.json"
solana-keygen new --no-bip39-passphrase --silent --outfile "$PROGRAM_KEYPAIR"
node scripts/configure-solana.mjs "$PROGRAM_KEYPAIR" "$ISSUER_KEYPAIR"
export CERTICHAIN_PROGRAM_ID="$(solana-keygen pubkey "$PROGRAM_KEYPAIR")"
export ANCHOR_WALLET="$ISSUER_KEYPAIR"
bun run test
node --test scripts/issuer-identity.test.mjs
(cd solana && anchor build && cargo test -p certichain --lib)
node scripts/export-idl.mjs
```

Jangan membuat ulang keypair program bila file sudah ada. Program keypair baru berbeda dari issuer signing wallet yang sudah dimiliki. Skrip memeriksa signature lokal dan alamat issuer; ini belum otorisasi Solana. Bila build gagal, berhenti. IDL asli diekspor ke `config/anchor-idl.json`; `null` berarti belum tersedia. Account terbaru 114 byte, format lama 82 byte tidak diterima. Tidak ada migrasi data demo.

## 2. Validator baru dan seluruh tes lokal

Terminal WSL pertama (pilih direktori ledger baru bila pernah dipakai):

```bash
solana-test-validator --ledger "$HOME/.local/share/certichain/validator-ledger"
```

Terminal kedua, root proyek, dengan variabel wallet/path tahap 1:

```bash
export RPC_URL=http://127.0.0.1:8899
solana airdrop 100 "$(solana-keygen pubkey "$ISSUER_KEYPAIR")" --url "$RPC_URL"
solana program deploy solana/target/deploy/certichain.so --program-id "$PROGRAM_KEYPAIR" --keypair "$ISSUER_KEYPAIR" --upgrade-authority "$ISSUER_KEYPAIR" --url "$RPC_URL"
node solana/tests/validator.mjs
node scripts/check-devnet-readiness.mjs "$PROGRAM_KEYPAIR" "$ISSUER_KEYPAIR"
```

Deployment ini lokal, **bukan Devnet**. Tes memerlukan config kosong: initialize dan penolakan wallet lain, penerbitan, hash panjang salah, duplikasi, PDA/identifier, hash dibaca, mismatch, account salah, pencabutan dan riwayat utuh. Rotasi authority sengaja tidak diekspos; kandidat tetap. Receipt tes memuat hash binary, bukan bukti Devnet; jangan mengganti binary tanpa tes ulang. Jangan mereset localStorage.

## 3. Devnet manual — hanya setelah semua tes lokal lulus

```bash
node scripts/check-devnet-readiness.mjs "$PROGRAM_KEYPAIR" "$ISSUER_KEYPAIR"
solana balance "$(solana-keygen pubkey "$ISSUER_KEYPAIR")" --url devnet
solana airdrop 2 "$(solana-keygen pubkey "$ISSUER_KEYPAIR")" --url devnet
solana program deploy solana/target/deploy/certichain.so --program-id "$PROGRAM_KEYPAIR" --keypair "$ISSUER_KEYPAIR" --upgrade-authority "$ISSUER_KEYPAIR" --url devnet
solana program show "$CERTICHAIN_PROGRAM_ID" --url devnet
ALLOW_DEVNET_TEST=true RPC_URL=https://api.devnet.solana.com node solana/tests/validator.mjs
```

Airdrop bisa dibatasi; gunakan sumber SOL Devnet resmi. Jangan mengganti jaringan ke Mainnet. Tes nyata memeriksa genesis Devnet, executable, ProgramData/config authority, initialize bila belum ada, penerbitan dan pencabutan record sintetis. Public key cocok tidak cukup untuk mengaktifkan issuer.

Setelah bukti nyata diperiksa, isi VITE_SOLANA_PROGRAM_ID dengan hasil deployment, pertahankan IDL asli, deploy layanan same-origin sesuai CERTICHAIN-AUTH.md, atur allowlist kandidat dan aktifkan flag login. Build aplikasi lokal: `bun run build`; Lovable memeriksa otomatis. Jangan menaruh credential RPC di VITE_*.

## 4. Uji aplikasi dengan Phantom nyata

Hubungkan kandidat, setujui login dan bukti kepemilikan, gunakan Admin Demo sebagai workspace sintetis, pilih sertifikat, tinjau ID/hash, Catat Hash ke Blockchain dan setujui Phantom. Tunggu konfirmasi dan account/hash terbaca. Periksa signature Explorer Devnet, verifikasi publik dan pencabutan. Wallet lain wajib ditolak program walau frontend diubah. Referensi lokal bukan bukti jaringan.

Domain HTTPS dan layanan login harus milik operator; hostname preview tidak otomatis dapat merutekan layanan terpisah. Semua tindakan di atas manual dan belum dilakukan di preview. Tidak ada langkah otomatis setelah percakapan berakhir.