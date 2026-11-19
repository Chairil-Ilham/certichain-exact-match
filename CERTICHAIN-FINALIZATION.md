# Laporan finalisasi CertiChain

## Kesimpulan

**Belum selesai sebagai aplikasi Solana Devnet aktif.** Penguatan source, tes offline, alur demo dan dokumentasi telah dilakukan; tidak ada klaim wallet kandidat sudah dimiliki, issuer aktif, deployment, IDL hasil build atau transaksi nyata. Tidak menghubungkan database permanen dan tidak mereset localStorage.

## Hasil per fase

1. Audit: inventaris source, konfigurasi, provider, demo store, otorisasi Anchor, skrip dan metadata halaman diperiksa. Struktur aplikasi dan desain tetap dipertahankan.
2. Autentikasi: rate limit 30/menit per IP tepercaya, body stream maksimum 4096 byte, endpoint eksplisit, TTL cleanup, cookie aman dan nonce terserialisasi. Endpoint `/auth/*` disediakan sebagai alias prefix frontend `/api/public/wallet/*`. Layanan belum dideploy.
3. Issuer: challenge khusus `issuer-ownership`, kandidat persis, proof dari sesi server dan tombol pembuktian di Login/Pengaturan. Login umum tidak dianggap proof issuer; status tidak pernah dinaikkan menjadi aktif berdasarkan alamat.
4. Anchor: state/error terpisah; record menyimpan identifier 32 byte selain hash, total 114 byte; verifikasi memeriksa issuer dan identifier. Authority rotation tidak diekspos, sehingga tidak ada instruksi yang bisa mengganti authority. Kandidat tetap dibatasi Anchor.
5. Tes lokal: 52 tes Vitest dan 2 tes operator lulus. Build Anchor/Rust/validator belum dijalankan: tidak ada Anchor/Solana CLI atau identitas program/signing wallet yang disediakan. Tidak mengganti issuer dengan wallet uji agar tes tampak lulus.
6. Frontend: layanan koneksi, validasi generated IDL, otorisasi jaringan dan operasi sertifikat terpisah. IDL belum tersedia ditandai `null`, bukan IDL rekaan. Operasi jaringan ditolak tanpa IDL yang sesuai; account owner/discriminator/identifier/bump, ProgramData dan authority wajib cocok. Perubahan akun atau isi transaksi saat signing membatalkan broadcast. Hash 64 hex bisa dikonversi kembali menjadi 32 byte.
7. Deployment: belum dilakukan. Skrip readiness membandingkan receipt validator dengan hash binary dan identitas operator; panduan Windows/WSL tersedia. Receipt lokal bukan bukti Devnet.
8. Blockchain nyata: belum dapat diverifikasi karena deployment/signature nyata tidak tersedia. UI unconfigured tetap tidak mengeluarkan signature, Explorer transaksi atau status sukses palsu.
9. Pengujian aplikasi: alur browser dijalankan ulang dengan data sintetis; lihat hasil di bawah.
10. Dokumentasi: README, contoh env tanpa secret, endpoint autentikasi, panduan Windows, pembaruan laporan issuer/setup dan laporan ini tersedia.

## Pengujian yang benar-benar dijalankan

- `bunx vitest run`: **52/52 lulus, 10 berkas**. Hash 12; nonce/signature 10; layanan TTL 6; lifecycle tanpa layanan 2; lifecycle sesi terautentikasi 1; Solana offline 7; kandidat issuer 5; authority jaringan simulasi 4; gate IDL 4; routing 1.
- `node --test scripts/issuer-identity.test.mjs`: **2/2 lulus**.
- Sintaks validator dan readiness diperiksa dengan `node --check`.
- Pemeriksaan otomatis aplikasi terbaru: **build OK**.
- Browser: Phantom tidak tersedia terdeteksi; Budi (NIM DEMO24003) dan Siti dapat dipilih serta masuk; mahasiswa ke admin ditolak; Admin Demo membuka sertifikat/mahasiswa/aktivitas/pengaturan; publik memeriksa CC-7KQ2-M9XA, lalu melihat Devnet belum dikonfigurasi.
- Browser membandingkan seluruh mahasiswa/sertifikat sebelum dan setelah alur: tetap sama. Login hanya menambahkan riwayat sesi pada browser pengujian. Tidak ada reset data.
- Lebar 390px untuk Login, Verifikasi, Tentang dan Beranda tidak melebar horizontal; screenshot desktop/mobile diperiksa. Tidak ada runtime page error pada alur tersebut.

Tes wallet memakai provider uji, signature memakai kunci uji, dan authority memakai account jaringan simulasi; **bukan ekstensi Phantom atau otorisasi Solana nyata**. Tes tidak boleh dijadikan klaim issuer aktif. Pengujian RPC offline tanpa IDL juga dapat berhenti pada gate konfigurasi: bukan bukti RPC Devnet dapat diakses. CRUD admin lengkap, approval ekstensi dan semua halaman dalam semua ukuran tidak dinyatakan telah diuji end-to-end.

## Batas keamanan/data

Admin Demo tetap sesi lokal yang dapat dimanipulasi pengguna browser; tidak menjanjikan role produksi yang tahan manipulasi. Hal ini hanya membuka data sintetis lokal; tidak dapat menggantikan signature backend atau authority program untuk transaksi. Sesi demo terpisah dari wallet. Data demo tidak tersinkronisasi antarperangkat, dan referensi transaksi lokal tidak menjadi sumber kebenaran jaringan.

Source tidak menyertakan literal private key/seed phrase; skrip operator membaca signer milik operator secara lokal tanpa mencetak secret. Pemeriksaan ini bukan audit keamanan eksternal. Aturan ignore repository dikelola platform; operator harus mengecualikan `solana/target`, file keypair dan env privat dari repository lokal sebelum menyimpan source. Keypair signing wajib di luar proyek.

## Langkah yang masih memerlukan operator

1. Tentukan domain HTTPS dan deploy layanan TTL pada origin yang sama; binding/route harus tersedia. Pertanyaan domain masih menunggu jawaban. Tidak ada domain contoh yang diaktifkan.
2. Siapkan wallet kandidat lokal, toolchain Anchor/Solana, identitas program dan build/tes validator baru hingga sukses; ekspor IDL asli.
3. Setelah semua tes program lulus, deploy binary yang sama ke Devnet dengan issuer sebagai payer/upgrade authority; verifikasi program/config serta transaksi nyata.
4. Konfigurasikan frontend dan allowlist layanan, buktikan ownership melalui Phantom, uji pencatatan/pencabutan/readback dan signature Explorer.

Perintah dapat disalin dari **CERTICHAIN-WINDOWS.md**. Jangan unggah secret, jangan deploy Mainnet, dan jangan menyatakan proyek selesai sebelum bukti nyata langkah 1–4 diperiksa. Tidak ada tugas yang berjalan otomatis setelah turn ini berakhir.