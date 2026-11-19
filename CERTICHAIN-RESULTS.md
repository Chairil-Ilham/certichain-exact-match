# Laporan lanjutan CertiChain

> Catatan historis. Laporan pekerjaan dan hasil pengujian terbaru ada di `CERTICHAIN-FINALIZATION.md`; panduan Windows ada di `CERTICHAIN-WINDOWS.md`. Account sertifikat terbaru 114 byte dan memerlukan IDL hasil rebuild, bukan layout 82 byte yang disebut dalam laporan awal ini.

## Status ringkas

Fitur demo lama dipertahankan. Tidak memasang Cloud, PostgreSQL atau database permanen; tidak mereset data pengguna. Integrasi hash dan Solana serta kode layanan autentikasi sementara telah ditambahkan. **Belum selesai sebagai sistem on-chain yang aktif:** tidak ada layanan autentikasi yang dideploy, program Devnet yang dideploy, Program ID nyata atau transaksi Phantom nyata dalam pengujian ini.

## Frontend dibuat

- `src/lib/certificate-hash.ts`: kanonisasi NFC dan SHA-256 32 byte.
- `src/lib/wallet-auth-api.ts`: permintaan sesi, challenge, verifikasi signature, logout; ditolak ketika layanan belum dikonfigurasi.
- `src/lib/solana.ts`: PDA, format account Anchor, pemeriksaan Devnet, pengiriman dan konfirmasi transaksi serta pembacaan ulang account.
- `src/components/app/blockchain-panel.tsx`: hash, salin, pemeriksaan terpisah, ringkasan persetujuan, loading/error, tindakan catat/cabut dan tautan bukti nyata.
- `src/lib/page-head.ts`: metadata unik halaman.

## Frontend diubah

- `src/providers/wallet.tsx`: satu WalletAuthProvider global (alias WalletProvider mempertahankan penggunaan lama), sesi wallet terpisah dari sesi demo, silent restore, cleanup listener, disconnect/pergantian akun, cek sesi dan otorisasi sebelum tanda tangan transaksi.
- `src/lib/types.ts`, `src/lib/store.ts`: status autentikasi dan referensi transaksi lokal; tidak mengubah format utama data demo atau memindahkan data.
- `src/components/app/wallet-chip.tsx`, `public-layout.tsx`.
- `src/routes/login.tsx`, `verify.tsx`, `certificate.$code.tsx`, `about.tsx`, `access-denied.tsx`.
- Seluruh halaman admin/mahasiswa: metadata spesifik; panel blockchain pada detail admin, keterangan integrasi/profil diperbarui. Halaman dan alur lama tetap ada.
- `vite.config.ts`: kompatibilitas paket jaringan Solana untuk runtime aplikasi.

## Backend dibuat, belum dideploy

- `services/wallet-auth/src/core.ts`: challenge nonce 256 bit, 5 menit, Ed25519, ikatan public key/domain/pesan, konsumsi sekali pakai.
- `services/wallet-auth/src/worker.ts`: layanan same-origin, sesi cookie HttpOnly/Secure/SameSite=Strict, logout, allowlist penerbit server, penyimpanan TTL terserialisasi dengan pembersihan alarm.
- `services/wallet-auth/wrangler.toml`: sumber konfigurasi penyimpanan sementara, tanpa domain atau role palsu.

Layanan sementara berada di luar aplikasi Lovable dan belum diaktifkan. Tanpa deployment dan rute HTTPS same-origin, autentikasi tetap tidak terverifikasi. Tidak ada klaim proteksi replay sempurna pada layanan nyata; pengujian atomisitas memakai penyimpanan uji dan antrean simulasi, bukan deployment penyimpanan nyata.

## Program Anchor dan IDL

- `solana/Cargo.toml`, `solana/Anchor.toml`.
- `solana/programs/certichain/{Cargo.toml,build.rs,src/lib.rs}`.
- Instruksi `initialize`, `simpan_sertifikat`, `verifikasi_sertifikat`, `cabut_sertifikat`; account Config dan CertificateRecord; error otorisasi/hash/revokasi.
- CertificateRecord 82 byte, Config 41 byte, termasuk discriminator. PDA memakai seed `certificate` dan hash ID internal. Anchor init menghitung rent-exemption berdasarkan space.
- `scripts/configure-solana.mjs` memperoleh identitas dari keypair deployment nyata.
- `scripts/export-idl.mjs` mengekspor IDL hasil Anchor build, bukan IDL rekaan.
- Unit test Rust ukuran account/PDA dan `solana/tests/validator.mjs` untuk penerbitan, verifikasi, duplikasi, penolakan penerbit lain dan pencabutan tersedia sebagai sumber.

**IDL belum dihasilkan. Rust/Anchor belum dikompilasi atau diuji.** Anchor CLI/Solana CLI dan identitas deployment nyata tidak tersedia. Tidak ada Program ID yang diklaim telah dideploy.

## Hasil pengujian

`bunx vitest run`: **30 pengujian lulus, 5 berkas**.

- Hash: 11 pengujian, panjang 32 byte/64 karakter hex, algoritma SHA-256 dibandingkan implementasi independen, determinisme, perubahan setiap field yang dikomit, NFC, payload tanpa field sensitif tambahan, revokasi demo terpisah.
- Autentikasi/nonce: 10 pengujian, signature Ed25519 valid, signature salah, kedaluwarsa tepat 5 menit, replay, domain salah, public key salah, pesan asli wajib, nonce unik, role tanpa allowlist, cookie aman, baca sesi/logout serta dua permintaan replay terserialisasi. Signature dibuat oleh kunci uji, bukan ekstensi Phantom nyata.
- Account Solana: 6 pengujian offline, PDA stabil dan spesifik ID, layout/discriminator account, mismatch/revokasi terpisah, tidak ada klaim tanpa konfigurasi dan RPC gagal tidak menjadi sertifikat invalid.
- Wallet provider: 2 pengujian menggunakan penyedia uji, Phantom tidak tersedia, koneksi, perpindahan child halaman tanpa permintaan koneksi ulang, pergantian akun, disconnect dan cleanup listener. Tidak menguji persetujuan ekstensi nyata.
- Routing: 1 pengujian halaman utama.

Pemeriksaan build otomatis terbaru: **build OK**. Tidak menjalankan build manual duplikat.

Browser nyata di preview lokal: Phantom tidak terpasang terdeteksi; login Siti dan NIM DEMO24001 berhasil membaca dashboard mahasiswa; login Admin Demo dan detail sertifikat berhasil; hash terlihat; pemeriksaan Devnet menunjukkan belum dikonfigurasi; tindakan on-chain dinonaktifkan tanpa otorisasi; verifikasi publik `CC-7KQ2-M9XA` berhasil; tampilan 390px tidak melebar horizontal. Tidak ada runtime page error pada alur ini. Pengujian akses mahasiswa ke admin pada percobaan browser sebelumnya mencapai halaman akses ditolak, tetapi tidak diulang dalam pemeriksaan final.

## Belum diuji nyata / konfigurasi wajib

1. Deployment layanan sementara same-origin, konfigurasi APP_ORIGIN, binding TTL dan allowlist wallet penerbit.
2. Ekstensi Phantom nyata: connect, signature approval/rejection, logout/account switching dengan sesi layanan nyata.
3. Toolchain Anchor/Solana, keypair program yang sebenarnya, wallet operator dengan SOL Devnet.
4. Anchor build, IDL hasil build, deployment executable, initialize oleh upgrade authority.
5. Jalankan validator integration dan cocokkan encoding frontend dengan IDL hasil build.
6. Program ID deployment di app dan RPC Devnet; pencatatan, PDA read, hash match, unauthorized rejection dan revocation pada jaringan nyata.

Panduan lengkap operator ada di `CERTICHAIN-SETUP.md`. Jangan menggunakan data akademik asli atau menganggap Admin Demo sebagai otorisasi produksi.