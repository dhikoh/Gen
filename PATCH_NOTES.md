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


## 20. Multi-Stage Registration Approval & Access Hardening (AUDIT-25)
- **Komponen Terdampak:** `prisma/schema.prisma`, `src/lib/authOptions.ts`, `src/app/api/auth/register/route.ts`, `src/app/api/admin/registrations/route.ts`, `src/app/[locale]/admin/registrations/page.tsx`, `src/app/[locale]/admin/registrations/AdminRegistrationsClient.tsx`, `src/app/[locale]/admin/layout.tsx`.
- **Perbaikan:** Mengimplementasikan `RegistrationStatus` enum (`PENDING_APPROVAL`, `APPROVED`, `REJECTED`) pada model `User`. Menambahkan proteksi autentikasi runtime di level `authOptions.authorize` untuk memblokir login pengguna dengan status `PENDING_APPROVAL` atau `REJECTED`. Membangun API atomik dan antarmuka GUI Admin Approval dengan badge hitung pendaftaran pending real-time serta notifikasi email otomatis saat status pendaftaran disetujui atau ditolak.

## 21. System Prompt Settings & Banned Content Moderation (AUDIT-26)
- **Komponen Terdampak:** `prisma/schema.prisma`, `src/app/api/admin/prompt-settings/route.ts`, `src/app/[locale]/admin/settings/AdminSettingsClient.tsx`, `src/app/[locale]/admin/settings/page.tsx`, `src/app/api/generate/route.ts`, `src/lib/promptGenerator.ts`, `src/lib/imagePromptGenerator.ts`, `src/components/generator/GeneratorForm.tsx`, `messages/id.json`, `messages/en.json`.
- **Perbaikan:** Membuat model singleton `PromptSettings` untuk menyimpan instruksi sistem AI global, kecepatan bicara (*speech rate*) default, *negative prompt* default, dan daftar kata terlarang (*banned words*). Menambahkan filter moderasi konten otomatis pada API `/api/generate` yang memblokir request jika memuat kata terlarang, serta menyuntikkan instruksi khusus superadmin secara transparan ke dalam Video Master Prompt dan Image Prompt Studio.

## 22. System Notifikasi Lonceng & Konsolidasi UI (Fase B & C)
- **Komponen Terdampak:** `prisma/schema.prisma`, `src/lib/notifications.ts`, `src/app/api/notifications/...`, `src/components/notifications/NotificationBell.tsx`, `src/app/[locale]/dashboard/notifications/...`, `src/components/auth/AuthForm.tsx`, `src/app/[locale]/admin/plans/...`, `messages/id.json`, `messages/en.json`, `src/app/[locale]/dashboard/layout.tsx`, `src/app/[locale]/admin/layout.tsx`.
- **Perbaikan:** 
  - **Skema DB & Dispatcher Centralized:** Menambahkan enum `NotificationType` dan model `Notification` pada Prisma schema (relasi cascade ke `User`). Membuat helper `src/lib/notifications.ts` (`notifyUser`, `notifyAllSuperadmins`).
  - **Endpoint API Notifikasi:** Mengimplementasikan endpoint RESTful terpadu (`GET /api/notifications` dengan pagination dan filter status `unread`, `PATCH /api/notifications/[id]` mark as read, `POST /api/notifications/mark-all-read`, `GET /api/notifications/unread-count`).
  - **Integrasi Event Bisnis:** Menghubungkan notifikasi otomatis ke aksi real-time: persetujuan/penolakan pembayaran, pengunggahan bukti bayar baru ke superadmin, persetujuan/penolakan registrasi akun, registrasi akun baru ke superadmin, ekspirasi masa langganan, dan status penguncian/pembukaan kanal.
  - **UI Topbar Bell & Halaman Notifikasi:** Membuat komponen `NotificationBell` dengan badge hitung unread real-time dan popover preview cepat yang terintegrasi di top header bar `DashboardLayout` dan `AdminLayout`. Membangun halaman penuh `NotificationsClient` untuk manajemen riwayat notifikasi.
  - **Refactor Auth & Plan Management:** Memperbaiki aliran UI `AuthForm.tsx` setelah registrasi agar menampilkan pemberitahuan bahwa akun memerlukan persetujuan Superadmin (`PENDING_APPROVAL`). Mengkonsolidasikan manajemen plan admin dengan menghapus `PlanManagement.tsx` yang redundant dan menjadikan `AdminPlansClient.tsx` sebagai satu-satunya *source of truth*. Memastikan 100% paritas kunci terjemahan i18n (`id.json` & `en.json`).

## 23. In-App Feature Guides & Complete Build Verification (Fase F & G)
- **Komponen Terdampak:** `src/app/[locale]/dashboard/panduan/page.tsx`, `src/app/[locale]/admin/panduan/page.tsx`, `src/app/[locale]/auth/page.tsx`, `src/app/[locale]/dashboard/layout.tsx`, `src/app/[locale]/admin/layout.tsx`, `messages/id.json`, `messages/en.json`.
- **Perbaikan:**
  - **In-App Feature Guides:** Menambahkan halaman panduan penggunaan interaktif bagi User (`/dashboard/panduan`) dan Superadmin (`/admin/panduan`) dengan layout kartu glassmorphic responsif. Menyediakan akses mudah melalui menu navigasi sidebar pada Dashboard Layout dan Admin Layout.
  - **Penghapusan Hardcoded Strings pada Auth Page:** Mengubah `src/app/[locale]/auth/page.tsx` untuk memanfaatkan `getTranslations('Auth')` pada metadata title/description, subtitle halaman, dan elemen fallback `Suspense`.

## 24. Hardening SaaS Security & Integrated Customer Service System (Fase 13)
- **Komponen Terdampak:** `src/lib/authHelpers.ts`, `src/app/[locale]/dashboard/layout.tsx`, `src/app/[locale]/admin/layout.tsx`, `src/app/[locale]/dashboard/generator/page.tsx`, `src/components/generator/GeneratorForm.tsx`, `src/app/api/support/...`, `src/app/api/admin/settings/route.ts`, `src/components/cs/FloatingCsWidget.tsx`, `src/components/providers/NextAuthProvider.tsx`, `src/lib/enumMapping.ts`, `src/components/support/UserSupportClient.tsx`, `src/app/[locale]/dashboard/support/page.tsx`, `src/components/support/AdminSupportClient.tsx`, `src/app/[locale]/admin/support/page.tsx`, `src/app/[locale]/admin/settings/AdminSettingsClient.tsx`, `prisma/schema.prisma`, `messages/id.json`, `messages/en.json`.
- **Perbaikan:**
  - **Standardized Route Protection:** Merefaktor `DashboardLayout` dan `AdminLayout` untuk menggunakan helper `requireRole` terpusat guna menegaskan role-based access control dan proteksi status pendaftaran secara konsisten.
  - **Feature Entitlement Gating:** Menghubungkan `GeneratorPage` dan `GeneratorForm` dengan `planFeatures` (`imagePromptStudio`, `htmlBlogExport`) sesuai paket langganan pengguna, serta memberikan UI visual "Locked" (terkunci dengan ikon gembok) untuk fitur yang belum diaktifkan.
  - **Customer Service Backend & API Threading:** Membangun seluruh endpoint CS (`GET /api/support/settings`, `GET/POST /api/support/tickets`, `GET/PATCH /api/support/tickets/[id]`, `POST /api/support/tickets/[id]/messages`) yang terintegrasi dengan `rateLimit` dan notifikasi lonceng otomatis saat ada tiket baru, balasan, atau perubahan status.
  - **Floating CS Widget & UI Interfaces:** Membuat komponen `FloatingCsWidget` interaktif yang mengambang secara global di seluruh aplikasi, halaman antrean tiket pengguna (`/dashboard/support`), serta dashboard manajemen tiket admin (`/admin/support`) dengan statistik real-time dan badge status tiket.
  - **Pengaturan CS Admin & Lokalisasi:** Memperbarui `AppSettings` API dan `AdminSettingsClient` untuk memungkinkan Superadmin mengonfigurasi Mode CS (Sistem Tiket, WhatsApp Direct, Email Direct), nomor kontak, jam operasional, dan mengaktifkan/mensejajarkan widget. Menambahkan 100% lokalisasi i18n (`id.json` & `en.json`) untuk seluruh komponen CS.
  - **Verifikasi Statis & Build Produksi:** Mengonfirmasi bahwa `npx tsc --noEmit` lulus bersih dengan 0 error, `npm run lint` valid, dan `npm run build` Turbopack berhasil mengompilasi seluruh 26 rute tanpa hambatan.
