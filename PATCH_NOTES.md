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

## 19. Restrukturisasi Link Media Sosial & Limitasi Channel (AUDIT-24)
- **Komponen Terdampak:** `src/app/api/channels/route.ts`, `src/app/api/channels/[id]/route.ts`, `src/lib/channelLockLogic.ts`.
- **Perbaikan:** Menambahkan pemutakhiran skema `socialLinks` untuk mendukung link media sosial terstruktur (Website, TikTok, Instagram, Facebook, YouTube) dan memastikan pengecekan `enforceChannelLimits` berjalan atomik.

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

## 24. Modul Customer Support Tiket & Hardening Rate Limit (AUDIT-FINAL-Phase-13-CS)
- **Komponen Terdampak:** `src/app/api/support/tickets/route.ts`, `src/app/api/support/tickets/[id]/messages/route.ts`, `src/components/support/UserSupportClient.tsx`, `src/components/support/AdminSupportClient.tsx`.
- **Perbaikan:** Mengintegrasikan sistem penanganan tiket CS penuh (buat tiket, balas pesan, ubah status) dengan otorisasi berbasis peran dan proteksi rate limiting pada seluruh rute pembuatan tiket.

## 25. High-Security SaaS Audit Remediation & Type Hardening (AUDIT-27 s/d AUDIT-30)
- **Komponen Terdampak:** `src/app/api/generate/route.ts`, `src/app/api/admin/...`, `src/app/api/support/tickets/route.ts`, `src/app/api/channels/...`, `src/app/api/drafts/...`, `src/app/api/notifications/route.ts`, `src/lib/promptGenerator.ts`, `src/lib/imagePromptGenerator.ts`, `src/lib/notifications.ts`, `prisma/seed.js`.
- **Perbaikan:**
  - **Pembersihan Total Tipe `any`:** Seluruh *type assertion* `as any` dan skema `z.any()` pada *API routes* dan utilitas inti telah diganti dengan tipe data *strict* bawaan Prisma (`Prisma.UserWhereInput`, `Prisma.PlanUpdateInput`, `Prisma.DraftWhereInput`, `Prisma.NotificationWhereInput`, `Role`, `SubscriptionStatus`, `SupportTicketStatus`, `RegistrationStatus`, `DraftType`) serta interface yang didefinisikan secara konkret (`ProfileChannelData`, `VideoConfigData`, `PromptSettingsData`, `ImageConfigData`).
  - **Hardening Error Handling & Zod Validation:** Seluruh respons error validasi API dibersihkan dari *raw error output* (menghapus ekspos internal Zod `flatten()`) dan disatukan di bawah penerjemah `getApiTranslator()` untuk mencegah kebocoran struktur data ke *client*.
  - **Proteksi Password Seed & Generasi Fitur Paket:** Mengubah `prisma/seed.js` agar membaca `SUPERADMIN_EMAIL` dan `SUPERADMIN_SEED_PASSWORD` dari environment variables, menjamin *upsert* superadmin tidak menimpa password yang sudah diubah di produksi. Menyingkronkan fitur `htmlBlogExport` ke seluruh skema paket bawaan.
  - **Verifikasi Kualitas Tipe Data & Kompilasi Produksi:** `npx tsc --noEmit` terverifikasi 100% lulus tanpa error tipe (0 error), dan `npm run build` berhasil memaketkan seluruh 26 rute aplikasi dan 33 endpoint API secara optimal.

## 26. Dashboard Analitik Bisnis Superadmin & Isolasi Portal (AUDIT-FINAL-01 s/d 05 / BUG-01 s/d BUG-11)
- **Komponen Terdampak:** `src/app/[locale]/admin/page.tsx`, `src/app/[locale]/admin/users/page.tsx`, `src/components/admin/AdminAnalyticsCharts.tsx`, `src/components/admin/UserManagement.tsx`, `src/app/[locale]/admin/layout.tsx`, `src/app/[locale]/dashboard/layout.tsx`, `package.json`, `messages/id.json`, `messages/en.json`.
- **Perbaikan:**
  - **Deduplikasi UI & Rute Manajemen Pengguna Terpisah (BUG-01, BUG-03):** Memindahkan antarmuka manajemen pengguna ke rute khusus `/[locale]/admin/users` (`src/app/[locale]/admin/users/page.tsx`). Menghapus komponen `<AdminPlansClient>` dari halaman *root* `/admin` untuk menghilangkan duplikasi visual.
  - **Isolasi Portal Superadmin & Pembersihan Navigasi (BUG-01, BUG-04, BUG-05):** Menghapus tautan "Back to User App" dari layout Admin dan menghapus tautan kondisional `Admin` dari layout Dashboard User, memastikan pembatas peran Superadmin vs User terisolasi secara penuh.
  - **Dashboard Finansial & Grafik Analitik Interaktif (BUG-02, BUG-06 s/d BUG-11):** Mengintegrasikan library `recharts` untuk visualisasi data finansial dan pertumbuhan SaaS di `/admin`:
    1. Metrik Kartu Finansial Real-time (Pendapatan Bulan Ini, Total Pendapatan All-Time, Subscriber Aktif, Invoice Pending).
    2. Grafik Tren Pendapatan Bulanan (`AreaChart` 6 Bulan Terakhir).
    3. Grafik Distribusi Pendapatan per Paket Langganan (`PieChart` Donut).
    4. Grafik Tren Pertumbuhan User Baru (`BarChart` 6 Bulan Terakhir).
    5. Grafik Distribusi Status Langganan User (`PieChart` ACTIVE vs INACTIVE).
    6. Kartu Ringkasan Operasional Sistem (Channel Terkunci, Tiket Support Terbuka, Registrasi Pending).
  - **Single Source of Truth Database Queries:** Seluruh metrik ditarik langsung dari database Prisma melalui agregasi *server-side* real-time (`aggregate`, `count`, `groupBy`).
  - **Lokalisasi Lengkap (i18n):** Menambahkan kunci terjemahan untuk seluruh label grafik, status, dan judul di `id.json` dan `en.json`.

## 27. Time-based CS Escalation & Financial Approval Hardening (AUDIT-FINAL-Phase-13)
- **Komponen Terdampak:** `prisma/schema.prisma`, `src/lib/csContact.ts`, `src/app/api/auth/registration-status/route.ts`, `src/components/auth/AuthForm.tsx`, `src/app/api/invoice/upload/route.ts`, `src/app/api/admin/payments/route.ts`, `src/app/[locale]/admin/payments/AdminPaymentsClient.tsx`, `src/app/[locale]/dashboard/billing/page.tsx`, `src/components/cs/CsEscalationBanner.tsx`, `src/app/api/cs/contact-info/route.ts`, `src/app/api/support/settings/route.ts`, `messages/id.json`, `messages/en.json`.
- **Perbaikan:**
  - **Skema DB & Tracking Waktu:** Menambahkan field `rejectionReason` (String?) dan `proofUploadedAt` (DateTime?) ke model `Invoice` pada Prisma schema.
  - **Eskalasi Status Registrasi:** Membangun API rate-limited `/api/auth/registration-status` untuk mendeteksi durasi pendaftaran yang belum disetujui tanpa mengekspos data pribadi user (anti user-enumeration). Memperbarui `AuthForm.tsx` untuk menampilkan banner eskalasi CS terintegrasi dengan tautan WhatsApp otomatis jika pendaftaran berada di state `PENDING` melebihi threshold `registrationPendingAlertHours` (default 24 jam) atau jika status `REJECTED`.
  - **Eskalasi Status Pembayaran Tagihan:** Memperbarui `src/app/[locale]/dashboard/billing/page.tsx` untuk menghitung durasi sejak `proofUploadedAt`. Menampilkan `CsEscalationBanner` warning pada tagihan pending jika melebihi threshold `paymentPendingAlertHours` (default 12 jam), serta banner error untuk tagihan yang ditolak beserta alasan penolakan konkret dari admin.
  - **Modal Alasan Penolakan Finansial Admin:** Memperbarui `AdminPaymentsClient.tsx` dan `POST /api/admin/payments` API route untuk mendukung modal penolakan tagihan dengan masukan `rejectionReason` yang dikomunikasikan secara transparan ke dashboard user.
  - **Single Source of Truth CS Settings & Public Alias:** Menggunakan `/api/support/settings` (authed) dan `/api/cs/contact-info` (publik & rate-limited) sebagai rujukan CS yang sah tanpa memicu redirect loop.
  - **Lokalisasi 100% (i18n):** Menambahkan seluruh kunci terjemahan eskalasi CS, modal alasan penolakan, dan footer landing page di `id.json` dan `en.json`.

## 28. Arsitektur Proteksi Akses (RBAC) & Middleware i18n
- **Komponen Terdampak:** `src/middleware.ts`, `src/app/[locale]/dashboard/layout.tsx`, `src/app/[locale]/admin/layout.tsx`, `src/lib/subscription.ts`.
- **Keputusan Arsitektur:**
  - `middleware.ts` dipokuskan khusus pada penanganan routing internasionalisasi (`next-intl`) berbasis cookie/header locale untuk menghindari masalah mismatch URL/locale dan infinite redirect loop saat sesi berakhir.
  - Proteksi Peran Pengguna (RBAC - SUPERADMIN vs USER) dan status langganan aktif diselenggarakan secara aman dan dinamis melalui *Server Component Layout Wrappers* (`requireRole()`, `requireActiveSubscription()`) serta utilitas autentikasi API helper.

## 29. Generator Presisi, Restrukturisasi Social Links & Auto-Demo Approval (Phase L5 - L10)
- **Komponen Terdampak:** `src/lib/promptGenerator.ts`, `src/app/api/generate/route.ts`, `src/app/api/drafts/route.ts`, `src/components/generator/GeneratorForm.tsx`, `src/app/[locale]/dashboard/channels/EditChannelClient.tsx`, `src/app/[locale]/dashboard/channels/ChannelManagerClient.tsx`, `src/app/api/channels/route.ts`, `src/app/api/channels/[id]/route.ts`, `src/app/api/admin/registrations/route.ts`.
- **Perbaikan:**
  - **Integrasi Generator Presisi (L5-L6):** Refactoring `promptGenerator.ts`, `/api/generate`, dan `/api/drafts` untuk mendukung field presisi baru (`targetSceneCount`, `aspectRatio`, `narrativeLoopStyle`, `visualLoopStyle`, `selectedProductId`). Menambahkan fallback otomatis `topic` ke `channel.niche` jika input kosong.
  - **UI Generator Form Overhaul:** UI Generator Form dilengkapi dengan combobox preset dinamis (Platform, Persona, Visual), modal *Quick Add Product*, dan input kontrol jumlah scene dan loop style.
  - **Restrukturisasi Media Sosial Channel (L7-L9):** Memperbarui `channelSchema` di backend dan membangun input media sosial terstruktur (Website, TikTok, Instagram, Facebook, YouTube) pada `EditChannelClient.tsx` beserta grid kartu channel dan icon badge di `ChannelManagerClient.tsx`.
  - **Auto-Demo Plan Assignment pada Approval (L10):** Memperbarui `/api/admin/registrations` agar pengguna yang disetujui pendaftarannya secara otomatis diberikan paket "DEMO" (3 Hari) secara aktif.

## 30. Audit Total Fase 13+, Lokalisasi i18n Auth, Strict Type Purge & Blueprint Synchronization
- **Komponen Terdampak:** `src/app/[locale]/admin/page.tsx`, `src/app/[locale]/admin/plans/page.tsx`, `src/app/[locale]/admin/plans/AdminPlansClient.tsx`, `src/app/api/channels/route.ts`, `src/app/api/channels/[id]/route.ts`, `src/lib/authOptions.ts`, `src/components/auth/AuthForm.tsx`, `messages/id.json`, `messages/en.json`, `Project Prompt Gen.txt`, `PATCH_NOTES.md`.
- **Perbaikan:**
  - **Deduplikasi UI Admin Dashboard & Visualisasi Recharts:** Halaman root `/admin` sepenuhnya dikonsolidasikan sebagai Executive Summary Dashboard yang didukung oleh 4 grafik analitik finansial real-time berbasis `recharts`. Form manajemen rencana yang redundat dihapus dari `/admin` dan dipusatkan di `/admin/plans`.
  - **Pembersihan Tipe Strict (Zero `any` in Admin Plans & Channels):** Menghapus penggunaan `z.any()` pada API Channels (`route.ts` & `[id]/route.ts`) dan menggantinya dengan skema objek Zod yang presisi. Menghapus assertion `plans as any` pada `/admin/plans/page.tsx` dengan mendefinisikan interface `PlanDto` di `AdminPlansClient.tsx`.
  - **Lokalisasi Error Autentikasi (i18n):** Menghapus string error terisolasi dalam Bahasa Indonesia di `authOptions.ts` dan menggantinya dengan kode error terstruktur (`RATE_LIMITED`, `PENDING_APPROVAL`, `REJECTED`, `INVALID_CREDENTIALS`). Menambahkan terjemahan kunci di `messages/id.json` & `messages/en.json` dan memperbarui `AuthForm.tsx` untuk penerjemahan dinamis berbasis `next-intl`.
  - **Sinkronisasi Blueprint Single Source of Truth:** Memperbarui `Project Prompt Gen.txt` pada **Bagian 5.2** (arsitektur proteksi RBAC berbasis layout & i18n middleware) dan menambahkan **Bagian 12: FITUR PASCA-BLUEPRINT** yang mendokumentasikan seluruh 10 ekstensi sistem pasca-blueprint.
  - **Verifikasi Kualitas Kunci:** Seluruh siklus kompilasi (`npx tsc --noEmit` & `npm run build`) berjalan bersih tanpa error tipe data pada 33 rute server.

### 31. Standardisasi UI Presets, Auto-fill Profil Kanal & Ekspor JSON Prompt Direct (Phase 14)
- **Komponen Terdampak:** `prisma/schema.prisma`, `src/components/ui/PresetSelect.tsx`, `src/app/api/platform-options/route.ts`, `src/app/api/persona-presets/route.ts`, `src/app/api/visual-aesthetic-presets/route.ts`, `src/app/api/niche-category-presets/route.ts`, `src/app/api/channels/route.ts`, `src/app/api/channels/[id]/route.ts`, `src/app/[locale]/dashboard/channels/EditChannelClient.tsx`, `src/components/generator/GeneratorForm.tsx`, `src/app/[locale]/dashboard/drafts/[id]/DraftActions.tsx`, `src/components/dashboard/UsedTitlesDirectory.tsx`, `PATCH_NOTES.md`.
- **Perbaikan:**
  - **Prisma Schema Update:** Menambahkan field `targetPlatform` (String?), `personaPov` (String?), dan `speechRate` (Float, default 0.35) pada model `ProfileChannel`.
  - **API Fallback Hardening:** Memperbarui seluruh API route preset (`/api/platform-options`, `/api/persona-presets`, `/api/visual-aesthetic-presets`, `/api/niche-category-presets`) agar selalu mengembalikan opsi default sistem jika database kosong.
  - **Komponen UI PresetSelect:** Membuat komponen reusable `PresetSelect.tsx` yang mendukung *dual-mode* (Pilihan Dropdown Preset + Sakelar Input Kustom) menggantikan tag `<datalist>` lama.
  - **Standardisasi Satuan Speech Rate:** Mengubah standar *speech rate* dari sekadar label tekstual menjadi nilai numeric detik-per-kata (`0.25` - `0.50` s/kata), di mana `0.35` s/kata adalah standar normal.
  - **Auto-Fill Profil Kanal:** Mengimplementasikan `useEffect` sinkron pada `GeneratorForm.tsx` sehingga ketika pengguna memilih kanal, seluruh konfigurasi (`targetPlatform`, `personaPov`, `speechRate`, `visualStyle`) otomatis terisi sesuai profil kanal tersebut.
  - **Direct JSON Prompt Download:** Menggantikan tombol "Copy This Prompt" dengan aksi **Download JSON Prompt** (`.json` file export) di `GeneratorForm.tsx` dan `DraftActions.tsx`.
  - **Kompilasi & Pengujian:** `npx prisma generate` dan `npx next build` lulus 100% tanpa error tipe data pada 33 API routes dan 26 rute halaman Next.js.
