# Laporan konfigurasi Issuer Wallet CertiChain

## Status

- Kandidat issuer resmi: `DUPoMPmu5Hbsh1RNHuc2VMV3GVCZkj8ZEZbybk5fRh4k`.
- Jaringan target: Solana Devnet. Status: **kandidat, belum aktif**.
- Tidak ada deployment, transaksi Solana, perubahan data demo, private key, atau seed phrase yang disimpan oleh pekerjaan ini.
- Kepemilikan alamat belum dibuktikan dengan wallet nyata. Public address bukan bukti kepemilikan atau otorisasi.

## Konfigurasi dan perlindungan yang disiapkan

1. `config/issuer.json` adalah konfigurasi publik terpisah dari wallet pengguna dan sesi demo. Frontend, skrip operator, dan build Anchor membaca kandidat yang sama.
2. `initialize` mensyaratkan tanda tangan kandidat dan kecocokan dengan upgrade authority dari ProgramData. Program ID tetap berasal dari keypair program sebenarnya; alamat issuer bukan Program ID.
3. `simpan_sertifikat` mensyaratkan kandidat signer serta authority config yang cocok. `cabut_sertifikat` mensyaratkan kandidat signer, config authority, serta issuer asli record. Pemeriksaan ini berada di Anchor, bukan hanya UI.
4. Frontend memblokir alamat lain, mensyaratkan sesi penerbit terverifikasi dan belum kedaluwarsa, serta kecocokan fee payer dengan wallet. Bukti account harus memiliki issuer yang sesuai. Tidak ada sesi demo yang dijadikan otoritas.
5. Skrip konfigurasi operator memeriksa public address dan tanda tangan lokal menggunakan signer yang sudah ada di perangkat operator. Skrip tidak membuat, menyalin, menyimpan ulang, atau mencetak secret. Jangan mengunggah file signer ke Lovable. Wallet perangkat keras memerlukan alur signing operator yang setara; jangan mengekspor seed untuk memenuhi skrip ini.
6. Layanan autentikasi TTL tetap belum aktif. Allowlist-nya tetap kosong sampai pengujian otorisasi program lulus; konfigurasi alamat ini tidak mengaktifkan issuer.
7. Instruksi revoke berubah menjadi urutan account `issuer, config, record`; wajib rebuild dan ekspor ulang IDL. IDL lama tidak kompatibel. Skrip ekspor menolak ABI lama atau constraint kandidat yang hilang.

## Pemeriksaan yang benar-benar dilakukan

- 36 pengujian Vitest lulus, termasuk 5 aturan kandidat issuer, hashing, decoding account, lifecycle wallet, dan autentikasi nonce.
- 2 pengujian skrip operator lulus: kecocokan public address dan penolakan tanpa signer.
- Sintaks skrip operator/validator diperiksa. Pemeriksaan otomatis aplikasi: berhasil.
- Login Admin Demo → Pengaturan berhasil; alamat kandidat dan status belum aktif tampil di desktop serta lebar 390px, tanpa error halaman. Data demo browser pengujian tidak berubah.
- **Belum dilakukan:** build Anchor/SBF, pengujian Rust, IDL hasil build, validator integration, tanda tangan issuer nyata, pemeriksaan deployment authority nyata, atau transaksi Devnet. Pengujian aplikasi bukan bukti otorisasi program Solana.

## Langkah wajib sebelum deployment Devnet

1. Siapkan Anchor 0.31.1, Solana CLI/SBF yang kompatibel, dan `@coral-xyz/anchor@0.31.1` untuk pengujian operator. Anchor/Solana CLI belum tersedia di lingkungan ini; Rust saja tidak cukup.
2. Di perangkat operator, buktikan penguasaan wallet kandidat melalui tanda tangan nyata. Cocokkan alamat signing wallet secara tepat. Jangan membagikan private key/seed phrase. Siapkan SOL Devnet setelah kesiapan build dan tes dipenuhi.
3. Siapkan keypair identitas program yang berbeda dari wallet penerbit, di luar source control. Jalankan dari root proyek:
   `node scripts/configure-solana.mjs <path-keypair-program> <path-signer-issuer-eksternal>`.
   Perintah berhenti jika signer tidak cocok. Atur provider wallet Anchor ke signer yang sama. Tidak ada deployment dalam skrip ini.
4. Export `CERTICHAIN_PROGRAM_ID` dari public identity program yang sebenarnya. Jalankan `anchor build` dari `solana/`, lalu pengujian Rust dengan identitas yang sama. Jangan menggunakan alamat contoh atau mengganti issuer dengan wallet pengujian.
5. Dari root, jalankan `node scripts/export-idl.mjs`; cocokkan seluruh discriminator, ukuran account, account order, serta issuer constraint dengan ABI frontend.
6. Gunakan validator lokal **baru**, bukan Devnet, dengan hasil build tersebut dan kandidat sebagai payer/upgrade authority. Dana lokal berasal dari airdrop validator. Jalankan dari root:
   `ISSUER_KEYPAIR=<path-signer-eksternal> node solana/tests/validator.mjs`.
   RPC default adalah `http://127.0.0.1:8899`. Jangan arahkan ke Devnet untuk melompati tahap ini. Test memeriksa executable/ProgramData authority, penolakan initialize/issue/revoke oleh wallet lain dengan error Anchor `Unauthorized`, penerbitan oleh kandidat, verifikasi, penolakan duplikat, revocation oleh kandidat, dan record yang tetap tersimpan. Test initialize hanya diuji bila config belum ada, sehingga validator baru wajib.
7. Hanya setelah build dan semua pengujian program lulus, operator boleh melakukan deployment Devnet terhadap binary yang sama, dengan signer kandidat sebagai payer dan upgrade authority. Tidak ada otomatisasi deployment atau klaim lulus yang diberikan di sini.
8. Baca Devnet genesis, executable program, ProgramData upgrade authority, dan config authority; semuanya harus sesuai. Lakukan initialization dan pengujian issue/revoke nyata menggunakan kandidat; validasi tanda tangan, konfirmasi transaksi, serta account hasilnya.
9. Setelah otorisasi program terbukti, selaraskan allowlist layanan TTL ke alamat kandidat dan aktifkan layanan same-origin. Baru set `VITE_SOLANA_PROGRAM_ID` ke program yang benar-benar deployed. Jangan memasukkan secret RPC ke variabel publik.

**Blocker:** toolchain Anchor/Solana, keypair identitas program sebenarnya, bukti penguasaan signer kandidat, validator lokal dan IDL hasil build, layanan TTL same-origin, serta persetujuan wallet/funding untuk transaksi nyata belum tersedia. Issuer tidak dinyatakan aktif.