# Patch Notes - Security & Hardening Audit Remediation

Pembaruan ini mencakup seluruh perbaikan bug dan arsitektur yang teridentifikasi dalam sesi audit keamanan dan kepatuhan sistem (*Security & Hardening Audit*). Seluruh pengerjaan telah diselaraskan dengan dokumen referensi asli (`Project_Prompt_Gen.txt`).

## 1. Keamanan Form & Auto-fill (R11)
- **Komponen Terdampak:** `AuthForm`, `ForgotPasswordForm`, `ResetPasswordForm`, `EditChannelClient`, `GeneratorForm`, `AdminSettingsClient`.
- **Perbaikan:** Menambahkan atribut `autoComplete="off"` secara eksplisit pada seluruh input sensitif untuk mencegah injeksi data yang tidak diinginkan melalui auto-fill browser.
- **Pembersihan XSS:** Mengganti pola `dangerouslySetInnerHTML` di `AuthForm.tsx` (yang digunakan untuk merender ikon panah) dengan string biasa / replace method.

## 2. Struktur Data Social Links (R6)
- **Komponen Terdampak:** `api/channels/route.ts`, `api/channels/[id]/route.ts`, `EditChannelClient.tsx`.
- **Perbaikan:**
  - Memodifikasi skema Zod pada API untuk menerima tipe `string` maupun `array` pada field `socialLinks`.
  - Merombak mekanisme form di `EditChannelClient` untuk melakukan *parsing* input string yang dipisahkan dengan koma menjadi array string yang bersih. Ini mendukung perluasan multi-platform di masa depan tanpa mengubah skema tabel database.
  - Memperbaiki pengetatan tipe data (TypeScript) di dalam komponen tersebut.

## 3. Modularisasi Logic Prompt (R8)
- **Komponen Terdampak:** `api/generate/route.ts`, `src/lib/promptGenerator.ts`, `src/lib/imagePromptGenerator.ts`.
- **Perbaikan:**
  - Mengabstraksi secara penuh fungsi pembuat *prompt* dari dalam file route API.
  - Membuat `generateMasterPrompt` dan `generateImagePrompt` di dalam modul library tersendiri (`src/lib/`).
  - Hasilnya, API Route kini jauh lebih bersih, mudah dibaca, dan modular, sesuai dengan arsitektur yang direkomendasikan.

## 4. Keamanan Tipe Data & Skema Zod
- **Komponen Terdampak:** `AdminSettingsClient.tsx`, `PlanManagement.tsx`, `page.tsx` (Admin Settings).
- **Perbaikan:**
  - Memperbaiki ketidaksesuaian tipe pada `heroTitle` dan `heroSubtitle` (menerima `string | null`).
  - Menerapkan pengecekan `null` (null-check) yang aman saat melakukan mutasi pada fitur *Plan Management* di modul Admin.
  - Skema konfigurasi *Video* dan *Image* kini telah divalidasi 100% menggunakan Zod di layer backend (`api/generate/route.ts`).

## 5. Implementasi i18n & Filter Halaman Draft (R1, R4)
- **Komponen Terdampak:** `DraftActions.tsx`, `DraftFilter.tsx`, `api/drafts/route.ts`.
- **Perbaikan:**
  - Melakukan migrasi string-string *hardcoded* yang tersisa pada aksi Hapus Draft ke mekanisme *localization* menggunakan *key* terjemahan (namespace `Drafts`).
  - API `GET /api/drafts` sekarang mem-filter query berdasarkan `channelId` dan `type` (VIDEO / IMAGE), sesuai dengan integrasi pencarian dari parameter URL.

## 6. Build & Linting (R12)
- **Komponen Terdampak:** `package.json`, `src/lib/env.ts`.
- **Perbaikan:**
  - Skrip npm telah disesuaikan; mengganti `eslint` dengan `next lint` pada perintah `"lint"`.
  - Sistem lingkungan (`env.ts`) diubah agar parameter SMTP bersikap dinamis/*optional* untuk mengamankan proses `next build` secara lokal maupun CI/CD yang mungkin belum meng-injeksi variabel produksi SMTP secara utuh.
  - **Status Akhir:** Perintah `npx tsc --noEmit`, `npm run lint`, dan `npm run build` berhasil dilewati tanpa *error* fatal.

## 7. Status Aset PWA (R10)
- Mengonfirmasi eksistensi dan validitas aset-aset statis (`icon-192x192.png`, `icon-512x512.png`) yang dibutuhkan oleh Web App Manifest di direktori `public/`.
