# CertiChain

Platform demonstrasi penerbitan dan verifikasi sertifikat akademik, dengan integrasi Phantom dan source program Solana Devnet. **Belum aktif on-chain:** build Anchor, IDL sebenarnya, layanan login HTTPS, dan transaksi Devnet masih memerlukan tindakan operator.

## Teknologi dan struktur

- React 19, TanStack Start/Router, Tailwind, Vitest.
- Solana SDK, SHA-256, Ed25519; Rust/Anchor 0.31.1.
- `src/routes`: halaman publik, admin demo, mahasiswa demo.
- `src/providers`: sesi demo terpisah dari wallet global.
- `src/lib`: penyimpanan demo, hash, koneksi, validasi IDL, otorisasi issuer, operasi sertifikat blockchain.
- `services/wallet-auth`: layanan autentikasi TTL terpisah dengan nonce sekali pakai dan cookie sesi.
- `solana`: source Anchor dan tes validator; `scripts`: pemeriksaan identitas, ekspor IDL, kesiapan operator.
- `config`: konfigurasi publik kandidat dan IDL hasil ekspor (`null` sampai build nyata tersedia).

## Instalasi dan frontend

```powershell
bun install
Copy-Item .env.example .env.local
bun run dev
bun run test
node --test scripts/issuer-identity.test.mjs
```

Build lokal operator: `bun run build`. Di editor Lovable, pemeriksaan aplikasi berjalan otomatis. Jangan masukkan private key, seed phrase, atau kredensial RPC ke variabel `VITE_*`.

## Login dan penggunaan

1. Publik: buka Verifikasi, masukkan `CC-7KQ2-M9XA`; hasil demo berbeda dari pemeriksaan Devnet.
2. Mahasiswa demo: cari nama atau NIM, pilih mahasiswa, lalu masuk; logout hanya menghapus sesi.
3. Admin Demo: kode `admin-demo` hanya simulasi lokal; bisa diubah melalui browser dan **bukan otorisasi produksi**.
4. Phantom: pasang ekstensi resmi, hubungkan sekali, setujui pesan login setelah layanan same-origin aktif. Pergantian akun mencabut sesi lama dan meminta autentikasi ulang.
5. Kandidat issuer: gunakan tombol pembuktian kepemilikan; signature khusus diverifikasi layanan. Kepemilikan bukan aktivasi program.
6. Pencatatan/cabut: memerlukan sesi issuer terverifikasi, bukti kepemilikan, IDL benar, authority jaringan sesuai dan persetujuan Phantom. Sukses hanya setelah konfirmasi serta pembacaan account.

## Backend, Anchor dan deployment

Lihat [panduan Windows](CERTICHAIN-WINDOWS.md), [konfigurasi teknis](CERTICHAIN-SETUP.md), [endpoint autentikasi](CERTICHAIN-AUTH.md), [laporan issuer](CERTICHAIN-ISSUER-REPORT.md), dan [hasil finalisasi](CERTICHAIN-FINALIZATION.md).

Tidak ada database permanen, Cloud, atau migrasi akademik ke server. Data demo hanya di localStorage browser, tidak tersinkronisasi antarperangkat. Jangan mereset data yang sudah ada. Nonce, sesi, dan pembatasan permintaan layanan sementara wajib kedaluwarsa dan dibersihkan. Tidak ada private key yang disertakan. Mainnet tidak didukung.
