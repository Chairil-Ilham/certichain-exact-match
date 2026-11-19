# Endpoint autentikasi CertiChain

Source tersedia, **layanan belum dideploy**. Operator harus menyediakan domain HTTPS yang sama dengan aplikasi dan binding TTL. Jangan mengaktifkan flag frontend sebelum layanan dapat diakses. Penyimpanan sementara tidak menyimpan mahasiswa atau sertifikat.

| Metode | Endpoint | Input / hasil |
|---|---|---|
| POST | `/auth/challenge` | `{ publicKey, purpose: "login" atau "issuer-ownership" }` → `{ challenge }` |
| POST | `/auth/verify` | `{ nonce, publicKey, message, signature }` (signature base58) → `{ session }` + cookie |
| GET | `/auth/session` | cookie → `{ session }` atau `{ session: null }` |
| POST | `/auth/logout` | hapus sesi server dan cookie |

Alias identik `/api/public/wallet/challenge`, `/verify`, `/session`, `/logout` dipakai frontend. Operator harus merutekan kedua prefix ke layanan yang sama, bukan fallback halaman HTML. Endpoint tidak boleh menerima cross-origin.

Challenge: nonce acak 256-bit, domain origin HTTPS persis, public key, tujuan, issuedAt, expiresAt maksimal 5 menit. Pesan asli dari penyimpanan server wajib cocok dan ditandatangani Ed25519. Read/verify/delete terserialisasi. Signature salah, replay, akun/domain/pesan berbeda dan nonce kedaluwarsa ditolak. Format pesan khusus CertiChain; tidak mengklaim kompatibilitas SIWS penuh.

Tujuan `issuer-ownership` hanya menerima kandidat resmi dari `config/issuer.json`. Keberhasilan signature menandai `ownershipVerified` pada sesi server; login biasa tidak menandai kepemilikan issuer. Role issuer berasal dari allowlist layanan, bukan input browser. Role tersebut bukan bukti otorisasi Solana.

Cookie: `__Host-certichain-wallet`, HttpOnly, Secure, SameSite=Strict, path `/`, tanpa Domain, 1 jam. Nilai token tidak dikembalikan sebagai JSON; penyimpanan memakai SHA-256 token. Pembatasan per IP tepercaya layanan: 30 permintaan/menit, 429 + Retry-After 60. Maksimal body 4096 byte, pembacaan stream dibatasi. Jangan mempercayai header IP dari proxy yang tidak dikelola.

Sesi/nonce/counter punya TTL dan alarm pembersihan setiap menit. Logout mencabut token; accountChanged menginvalidasi sesi dan menandatangani challenge baru. Putus koneksi hanya mengakhiri sesi wallet, bukan menghapus data atau sesi mahasiswa demo. Jika jaringan gagal saat logout, UI menolak autentikasi lokal dan memberi peringatan; server masih menggunakan batas waktu 1 jam.

Status 400: challenge/signature/JSON salah; 403: domain, origin atau kandidat salah; 404: endpoint salah; 405: metode salah; 413: body terlalu besar; 429: terlalu banyak permintaan; 503: origin belum disiapkan. Tidak ada CORS wildcard.

Deploy terpisah dari Windows/WSL setelah konfigurasi domain:

```bash
bunx wrangler deploy --config services/wallet-auth/wrangler.toml
```

Atur APP_ORIGIN serta route same-origin melalui akun hosting operator; ISSUER_WALLETS tetap kosong sampai tes program membuktikan otorisasi. Domain workers.dev terpisah tidak cukup. Preview Lovable tidak menyediakan pemetaan layanan ini dari source. Setelah deployment nyata, uji challenge/signature/session/logout dengan Phantom; test penyimpanan simulasi tidak menggantikan uji layanan produksi.