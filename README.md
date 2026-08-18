# Prompt Gen

SaaS untuk Content Creator yang membantu menyusun Master Prompt AI secara terstruktur.

## Instalasi

1. Clone repositori ini.
2. Jalankan `npm install`.
3. Salin `.env.example` ke `.env` dan sesuaikan nilainya:
   - `DATABASE_URL`: URI database PostgreSQL (wajib).
   - `NEXTAUTH_SECRET`: String acak untuk enkripsi sesi (wajib).
   - `NEXTAUTH_URL`: URL utama aplikasi (misal: `http://localhost:3000`).
   - `STITCH_API_KEY`: API Key untuk Stitch Design System.
   - `SMTP_HOST`: Host SMTP (misal: `smtp.resend.com`).
   - `SMTP_PORT`: Port SMTP (misal: `465`).
   - `SMTP_USER`: Username SMTP.
   - `SMTP_PASSWORD`: Password SMTP.
   - `SMTP_FROM`: Alamat email pengirim (misal: `noreply@promptgen.com`).

## Database & Migrasi

1. Pastikan PostgreSQL berjalan.
2. Jalankan migrasi dan sinkronisasi skema:
   ```bash
   npx prisma db push
   ```
   Atau `npx prisma migrate dev` jika sudah ada riwayat migrasi.

3. Jalankan seed untuk mengisi data awal:
   ```bash
   node prisma/seed.js
   ```
   **PENTING**: Seed akan membuat akun `superadmin` dengan username/password bawaan. Wajib diganti setelah deploy pertama.

## Menjalankan Aplikasi

Jalankan server pengembangan:
```bash
npm run dev
```

Buka `http://localhost:3000` di browser.
