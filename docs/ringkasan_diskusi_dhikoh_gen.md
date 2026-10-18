# Rekonstruksi Diskusi dhikoh-gen — Yang Sudah & Belum Selesai

## Alur Diskusi (Direkonstruksi dari `History Diskusi.txt`)

### Giliran 1 — AI: Analisis Celah Keamanan
AI menemukan celah di codebase Prompt Gen:
- **G-01:** `localStorage` global — `scenePromptState`, `generatorFormState`, dll. tidak di-namespace per user
- **G-03:** Enkripsi AES-GCM tanpa AAD — ciphertext bisa disalin antar user
- **G-04:** IP rate-limit pakai `x-forwarded-for` langsung (spoofable)
- **G-05:** `HERMES_SECRET_KEY` di GET `/api/drafts` — bukan constant-time
- **G-14:** YouTube API key pakai env global, kuota dibagi semua user

AI juga bertanya: **"apakah 'remotion' maksudnya AI eksternal menulis kode animasi baru dari skrip, atau membuat ulang animasi dari video?"**

### Giliran 2 — USER: Konfirmasi
> "Ya betul itu maksud saya"

→ Dikonfirmasi: **AI eksternal menulis kode animasi dari skrip**, aplikasi hanya merender di browser.

### Giliran 3 — AI: Desain Arsitektur Render
AI merumuskan 4 keputusan arsitektur:
1. **Prompt mode kode** — timeline + scene + durasi + narasi masuk ke prompt, maks 120 scene
2. **Kontrak kode** — satu file HTML self-contained dengan `window.__anim.seek(t)`, tanpa library eksternal
3. **Render browser** — frame via `seek(t)`, audio via WebAudio, unduh/upload ke Drive
4. **Sandbox iframe** — tanpa `allow-same-origin`, wajib sebelum fitur render dirilis

### Giliran 4 — AI: Proposal 5 Fase
AI mengusulkan urutan:

| Fase | Nama | Deskripsi |
|------|------|-----------|
| **1** | Isolasi per user & perbaikan celah | Keamanan: AAD, localStorage, rate-limit, token |
| **2** | Batas 120 scene & mode Auto | Scene limit, auto scene count |
| **3** | Tab Full Video | UI tab video di Scene Prompt Studio |
| **4** | Kode animasi & render | AI generates HTML animation code, browser render |
| **5** | Google Drive | Upload video ke Drive user |

### Giliran 5 — USER: Perintah detail
> "OK buatkan secara detail, pastikan juga menyangkut blueprint maupun notepatchnya."

### Giliran 6 — USER: Tambahan requirement
> "Jangan lupa tetap harus ada fungsi judul yang sudah terpakai agar AI eksternal tidak membuat judul atau membahas topik yang sama."
> "Pastikan promptnya detail end to end tanpa gap. Karena AI agent saya memiliki pemahaman terbatas."
> "Masukkan juga celah yang kamu temukan agar diperbaiki oleh AI agent saya."

### Giliran 7 — AI: Respons terakhir (TERPUTUS)
> "Saya baca dulu bagian yang menentukan presisi prompt: mekanisme judul terpakai, struktur blueprint, dan format PATCH_NOTES. Sedang menyelesaikan pembacaan..."

**→ Diskusi terputus di sini. AI baru selesai membuat FASE 1, belum membuat FASE 2–5.**

---

## Status Produksi Dokumen

| Dokumen | Status |
|---------|--------|
| `00_ATURAN_UMUM.md` | ✅ Selesai (14 aturan emas + konvensi kode) |
| `FASE_1_ISOLASI_HARDENING.md` | ✅ Selesai (9 tugas: 1.1–1.9, 426 baris detail) |
| `FASE_2_SCENE_LIMIT_AUTO.md` | ❌ Belum dibuat |
| `FASE_3_TAB_FULL_VIDEO.md` | ❌ Belum dibuat |
| `FASE_4_KODE_ANIMASI_RENDER.md` | ❌ Belum dibuat |
| `FASE_5_GOOGLE_DRIVE.md` | ❌ Belum dibuat |

---

## Apa yang Perlu Dilanjutkan?

### Opsi A: Saya buatkan FASE 2–5 sekarang
Saya bisa melanjutkan pekerjaan AI sebelumnya dan menulis dokumen prompt detail untuk FASE 2–5, dengan presisi yang sama seperti FASE 1 (kode lengkap, lokasi file, test cases, definition of done).

**Saya sudah punya konteks lengkap:**
- Codebase export 229 file (sudah dianalisis)
- Aturan umum dan konvensi
- Arsitektur Prompt Gen (Prisma schema, routes, components)
- Keputusan desain yang sudah dikonfirmasi (render browser, sandbox, kontrak kode)
- PATCH_NOTES dan Blueprint format

### Opsi B: Eksekusi FASE 1 dulu, lalu tulis FASE 2–5
Jalankan FASE 1 di repo dhikoh-gen untuk menutup celah keamanan terlebih dahulu, karena USER menyatakan celah harus ditutup **sebelum** fitur render dan Drive.

### Opsi C: Semuanya sekaligus
Tulis FASE 2–5 dan langsung eksekusi FASE 1–5 secara berurutan.

---

## Scope Tiap Fase yang Belum Dibuat

### FASE 2 — Batas 120 Scene & Mode Auto
- Tambah konstanta `MAX_SCENE_COUNT = 120` di `scenePromptLimits.ts`
- Mode Auto: AI tentukan jumlah scene dari durasi target
- Validasi di `promptGenerator.ts` dan `GeneratorForm.tsx`
- Update `ContentArchetype` dengan default scene count
- Test: scene count bounds, auto mode calculation

### FASE 3 — Tab Full Video di Scene Prompt Studio
- Tab baru di `ScenePromptStudioClient.tsx`
- Timeline viewer: scene cards dengan durasi
- Audio waveform preview (dari Voice Studio data)
- Export kontrak: JSON manifest untuk FASE 4
- UI: timeline scrubber, scene reorder drag-drop

### FASE 4 — Kode Animasi & Render (Inti fitur)
- Prompt builder: generate HTML animation code dari skrip + timeline
- `UsedTitle` integration: judul terpakai masuk ke prompt sebagai blacklist
- Sandbox iframe: `sandbox="allow-scripts"` tanpa `allow-same-origin`
- `window.__anim.seek(t)` kontrak
- WebAudio mixer: narasi audio + background
- Frame capture: `canvas.toDataURL()` per frame
- Video assembly: WebCodecs atau MediaRecorder
- CSP khusus iframe

### FASE 5 — Google Drive Upload
- OAuth2 flow: Google Sign-In scoped ke Drive
- Token enkripsi: `googleDriveAad(userId)` (sudah disiapkan di FASE 1)
- Upload API: resumable upload ke folder user
- Progress UI: upload progress bar
- Cleanup: revoke token on logout
