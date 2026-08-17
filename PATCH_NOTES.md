# Patch Notes & Changelog

## [1.0.1] - Audit Remediation Patch

Patch ini berisi penyelesaian menyeluruh (remediasi) dari hasil audit blueprint Prompt Generator SaaS. Pembaruan ini memastikan sistem 100% selaras dengan spesifikasi teknis (blueprint), menutupi celah keamanan, dan menstandarisasi desain UI/UX.

### 🛡️ Keamanan & Integritas Sistem (Subscription & Limits)
*   **Active Expiry Enforcement**: Refaktorisasi `getSubscriptionState()` di `src/lib/subscription.ts` agar tidak lagi bersifat *read-only*. Fungsi kini secara aktif melakukan *side-effect* mengubah status langganan ke `EXPIRED` di *database* jika masa aktif habis, dan secara otomatis memicu pemanggilan `enforceChannelLimits()` untuk mengunci *channel* sekunder (sesuai Blueprint Spec 3.4).
*   **Server-Side Channel Lock**: Menambahkan proteksi pada sisi *server* di endpoint `PUT /api/channels/[id]`. Pembaruan profil *channel* yang berstatus `isLocked = true` kini akan ditolak langsung oleh API dengan HTTP 403, mencegah eksploitasi *bypass* form *read-only* di sisi *client*.

### ⚙️ Manajemen Admin & Paket (Plan)
*   **Dynamic Plan Features**: Memperbarui skema validasi dan *handler* di `PUT /api/admin/plans` untuk menerima, memproses, dan menyimpan struktur JSON pada kolom `features`.
*   **Plan Management UI**: Mengimplementasikan komponen antar muka baru `PlanManagement.tsx` di *dashboard* Superadmin. Admin kini dapat mengontrol pembatasan fitur secara spesifik per paket langganan (seperti mengaktifkan/menonaktifkan *Image Prompt Studio*).

### 🌍 Internasionalisasi (i18n) API
*   **Menghapus Hardcode Bahasa**: Menyelesaikan isu 111+ *instance* `NextResponse.json({ error: "..." })` berbahasa Indonesia yang tertanam langsung (*hardcode*) di seluruh berkas `/api`.
*   **Server-Side Translations**: Membuat *helper* `getApiTranslator()` menggunakan `next-intl/server`.
*   **API Namespace**: Menambahkan *namespace* penerjemahan khusus `"API"` ke dalam kamus `messages/id.json` dan `messages/en.json`, memastikan respons *error* dan *success* dari sisi *server* konsisten mengikuti preferensi bahasa pengguna (Inggris/Indonesia).

### 🎨 Standarisasi Desain (Glassmorphism)
*   **Global Application**: Menyelaraskan seluruh kartu komponen (*card*) yang sebelumnya menggunakan *style* bawaan Tailwind (`bg-white dark:bg-zinc-900`) untuk sepenuhnya menggunakan sistem token *Glassmorphism* (`glass-panel`).
*   **Cakupan Refaktor**: Konsistensi UI telah diterapkan secara menyeluruh ke halaman *Dashboard*, *Billing*, panel *Superadmin*, daftar *Drafts*, editor rincian *Draft*, hingga *ChannelManagerClient.tsx*.

### ⚡ Generator Logic (Image Prompt Studio)
*   **Bypass Meta-Prompting (No Hop)**: Meluruskan penyimpangan alur pada `src/lib/imagePromptGenerator.ts`. Generator tidak lagi membuat instruksi yang memaksa pengguna meminta AI eksternal membuat format JSON untuk prompt *Midjourney/DALL-E*. Sistem kini merakit prompt siap-pakai langsung di memori *Node.js* sesuai variabel konfigurasi.
*   **Auto-fill JSON**: Memperbarui komponen `GeneratorForm.tsx` untuk menangkap `finalJson` dari *backend* saat mode `IMAGE`. Alur *copy-paste* ke ChatGPT secara otomatis dilompati (*bypassed*), sehingga mempercepat proses *drafting* gambar secara signifikan.

### 💳 Pembayaran & Dokumentasi
*   **PaymentProvider Abstraction**: Mengatasi *dead-code* (kode tidak terpakai) di `/api/invoice/route.ts` dengan merefaktorisasi alur pembuatan *invoice* agar memanggil metode polimorfisme `ManualTransferProvider.createInvoice()` sesuai abstraksi arsitektur sistem pembayaran.
*   **Pembaruan Dokumentasi**: Menambahkan dokumentasi *environment variables* yang wajib ada untuk konfigurasi SMTP (Resend/Nodemailer) ke dalam berkas `README.md`.
*   **Render UI Ekstra**: Menambahkan blok UI khusus di editor `DraftDetailPage` untuk membaca *payload* `parsedData.variations` (visualisasi variasi prompt, *aspect ratio*, *negative prompt*) secara rapi.
