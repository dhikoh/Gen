# Patch Notes - Security & Hardening Audit Remediation

Pembaruan ini mencakup seluruh perbaikan bug dan arsitektur yang teridentifikasi dalam sesi audit keamanan dan kepatuhan sistem (*Security & Hardening Audit*). Seluruh pengerjaan telah diselaraskan dengan dokumen referensi asli (`Project_Prompt_Gen.txt`).

## 1. Perbaikan PWA Assets (AUDIT-01)
- **Komponen Terdampak:** `public/icon-192x192.png`, `public/icon-512x512.png`, `public/favicon.ico`.
- **Perbaikan:** Membuat file PWA icon riil menggunakan `generate_image` untuk menggantikan file yang sebelumnya hilang. Memastikan manifest.json me-resolve icon secara valid tanpa 404.

## 2. Autentikasi dan Sesi "Remember Me" (AUDIT-02)
- **Komponen Terdampak:** `src/lib/authOptions.ts`.
- **Perbaikan:** Mengimplementasikan kustomisasi JWT `encode` dan `decode` agar durasi maxAge session cookie menghormati nilai parameter `rememberMe` (1 hari atau 30 hari).

## 3. Strict Environment Validation (AUDIT-03)
- **Komponen Terdampak:** `src/lib/env.ts`, `src/app/[locale]/layout.tsx`, `src/instrumentation.ts`.
- **Perbaikan:** Menambahkan pengecualian validasi runtime SMTP hanya jika fase tersebut merupakan `next build`. Panggilan validasi dipindahkan ke `instrumentation.ts` agar crash dilakukan sedini mungkin sebelum app melayani request.

## 4. Perbaikan Logika Generator Prompt (AUDIT-04 & AUDIT-07)
- **Komponen Terdampak:** `src/lib/promptGenerator.ts`, `src/lib/imagePromptGenerator.ts`.
- **Perbaikan:** Memperbaiki pengaksesan data dari `p.shortDesc` menjadi `p.description`. Menambahkan generasi narrative prompt di `imagePromptGenerator` agar hasil variasi tidak hanya tag-based.

## 5. UI Dashboard & Draft Clean-Up (AUDIT-05 & AUDIT-06)
- **Komponen Terdampak:** `src/app/[locale]/dashboard/drafts/[id]/page.tsx`.
- **Perbaikan:** Menghapus komponen mati seperti `master_prompt` dan `system_instruction` dari halaman Draft Detail. Menambahkan penampang UI yang fungsional untuk `caption_medsos`, `ide_thumbnail`, `html_blog`, dan variasi prompt naratif dengan fitur copy button yang dapat digunakan kembali.

## 6. Standarisasi i18n pada API (AUDIT-08)
- **Komponen Terdampak:** Direktori `src/app/api/...`, `messages/en.json`, `messages/id.json`.
- **Perbaikan:** Menerapkan skrip migrasi untuk menghapus string bahasa Indonesia yang di-*hardcode* di dalam backend route API (seperti validasi, limits).

## 7. Idempotency Payment REJECT (AUDIT-09)
- **Komponen Terdampak:** `src/app/api/admin/payments/route.ts`.
- **Perbaikan:** Menggunakan hasil count dari `updateMany` untuk memastikan status tagihan yang di-reject masih berada dalam state `PENDING` (menghindari double-reject/approve race conditions).

## 8. Mengatasi Race Conditions (AUDIT-10 & AUDIT-11)
- **Komponen Terdampak:** `src/app/api/channels/route.ts`, `src/app/api/auth/register/route.ts`.
- **Perbaikan:** Menggunakan `prisma.$transaction` dan pengecekan kode error `P2002` (Prisma Unique Constraint Violation) untuk menjamin limitasi *maxChannels* dan email duplikat tidak kebobolan saat brute force concurrent requests.

## 9. Locale Dinamis di Forgot Password (AUDIT-12)
- **Komponen Terdampak:** `src/app/api/auth/forgot-password/route.ts`.
- **Perbaikan:** Link reset kata sandi kini menggunakan prefix locale yang diekstrak dari cookie `NEXT_LOCALE`, alih-alih di-*hardcode* sebagai `/id/`.

## 10. Penerapan CSS Variables (AUDIT-13)
- **Komponen Terdampak:** `src/app/[locale]/globals.css`.
- **Perbaikan:** Memindahkan warna literal hex dan rgba statis ke Custom Properties (`:root`) untuk mematuhi sistem desain token UI yang modular dan responsif terhadap tema.

## 11. Strict Payment Types & Cleanup (AUDIT-14, AUDIT-15, AUDIT-16)
- **Komponen Terdampak:** `src/lib/payments/types.ts`, `src/lib/payments/manualTransferProvider.ts`, `src/app/api/invoice/route.ts`.
- **Perbaikan:** Menghapus penggunaan tipe `any` pada arsitektur payments dengan mendeklarasikan interface DTO konkret (`CreateInvoiceInput`). Membersihkan sisa file skrip (`*.js`) ke dalam folder `scripts/` dan menghapus `design.md` yang mengotori root.

## 12. Mencegah Data Leakage di Admin API (AUDIT-17)
- **Komponen Terdampak:** `src/lib/db.ts`, `src/app/api/admin/users/route.ts`, `src/app/api/admin/users/[id]/route.ts`.
- **Perbaikan:** Menambahkan `SAFE_USER_SELECT` sebagai *Single Source of Truth* untuk fields user yang boleh diekspos (tanpa `passwordHash`). Mengubah semua *findMany* dan *findUnique* admin endpoints untuk mematuhi selector ini.

## 13. Sanitasi XSS di JSON Parse Output (AUDIT-18)
- **Komponen Terdampak:** `src/app/[locale]/dashboard/drafts/[id]/page.tsx`, `package.json`.
- **Perbaikan:** Mengintegrasikan `isomorphic-dompurify` pada seluruh node yang merender output AI melalui `dangerouslySetInnerHTML` (terutama field `html_blog`), memblokir potensi serangan XSS (Cross-Site Scripting).

## 14. Direktori Judul per Channel (AUDIT-19)
- **Komponen Terdampak:** `src/app/api/drafts/export/route.ts`, `src/app/api/drafts/import-titles/route.ts`, `src/components/dashboard/UsedTitlesDirectory.tsx`, `src/app/[locale]/dashboard/channels/EditChannelClient.tsx`.
- **Perbaikan:** Menambahkan API endpoints untuk export/import daftar judul (CSV/JSON), beserta UI "UsedTitlesDirectory" di menu Edit Channel agar user dapat melihat riwayat judul dan mengunggah batch judul massal guna mencegah duplikasi ide.

## 15. Finalisasi Lokalisasi Email & Paket (AUDIT-20)
- **Komponen Terdampak:** `messages/en.json`, `messages/id.json`, `src/app/api/auth/forgot-password/route.ts`, `src/app/api/admin/payments/route.ts`, `src/components/admin/PlanManagement.tsx`.
- **Perbaikan:** Mengubah seluruh string ter-hardcode bahasa Indonesia di dalam API email transaksional dan komponen UI PlanManagement untuk secara dinamis menggunakan kunci i18n (`next-intl`) berbasis lokal dari user atau cookie.

## 16. Transaksi Atomik Batas Channel (AUDIT-21)
- **Komponen Terdampak:** `src/lib/channelLockLogic.ts`, `src/lib/payments/manualTransferProvider.ts`, `src/app/api/admin/payments/route.ts`.
- **Perbaikan:** Memindahkan logika `enforceChannelLimits` agar berpartisipasi langsung dalam scope `prisma.$transaction` yang sama dengan `activateSubscription`, menghindari partial state failure jika server crash setelah langganan aktif namun channel belum ter-unlock.

## 17. Perbaikan Redirect Loop Autentikasi (AUDIT-22)
- **Komponen Terdampak:** `src/middleware.ts`, `src/app/[locale]/dashboard/layout.tsx`, `src/app/[locale]/admin/layout.tsx`.
- **Perbaikan:** Menghapus perlindungan redirect explicit berbasis next-auth dari layer middleware root dan mendelegasikan proteksi rute dinamis (role SUPERADMIN vs USER) sepenuhnya ke Server Components (layout) untuk memecahkan infinite redirect loop saat session timeout.

## 18. Konfigurasi Netral Auth & Skema JSON AI (AUDIT-23)
- **Komponen Terdampak:** `README.md`, `src/lib/authOptions.ts`, `src/app/auth/page.tsx`.
- **Perbaikan:** Memperbaiki dokumentasi variabel lingkungan `SMTP_PASS` menjadi `SMTP_PASSWORD`. Membuat rute netral `/auth` untuk menangani pengalihan login NextAuth berbasis cookie `NEXT_LOCALE`. Mengonfirmasi keselarasan nama field skema JSON (`segments`, `caption`, `duration_estimation`) pada seluruh komponen generator dan UI.

