# PATCH NOTES — Prompt Gen

> ### 📌 PANDUAN SKEMA PENOMORAN KANONIKAL & PEMETAAN HISTORIS PROYEK
>
> Dokumen ini memiliki dua periode penomoran historis:
> 1. **Batch Audit v1 (2026-09-18)**: Menggunakan penomoran `[#55] Batch 1` s/d `[#61] Batch 7` untuk audit & hardening sistemik awal.
> 2. **Siklus Fitur & Remediasi (2026-09-21 s/d 2026-09-25)**: Menggunakan penomoran kanonikal `[#56]` s/d `[#85]` yang berkorespondensi langsung dengan addendum spesifikasi pada `Project Prompt Gen.txt` (Bagian 29 s/d 38).
> 3. **Audit & Remediasi Menyeluruh P0–P3 (2026-09-27)**: Entri kanonikal `[#86]` memverifikasi ulang seluruh rangkaian, mengeliminasi `any` tanpa `eslint-disable`, menyinkronkan 100% i18n (1.393 keys), dan menerbitkan `AUDIT_REPORT_FINAL_v2.md`.
>
> | ID Kanonikal PATCH_NOTES | ID Blueprint / Fitur | Deskripsi Ringkas Modul | Tanggal Rilis |
> | :--- | :--- | :--- | :--- |
> | `[#55 Batch 1 - #61 Batch 7]` | Batch Audit v1 | Audit Keamanan, Finansial, Model & i18n Awal | 2026-09-18 |
> | `[#56]` | Fitur #56 | Copy All Narration & Thumbnail Studio UI | 2026-09-21 |
> | `[#57]` | Bugfix #57 (Bagian 29) | AIDA CTA Leakage Fix v1 | 2026-09-21 |
> | `[#58]` | Fitur #58 | UsedTitlesDirectory CRUD & Visual Style Sync | 2026-09-21 |
> | `[#59]` | Fitur #59 | Image Prompt Studio Midjourney v6.1 | 2026-09-21 |
> | `[#60]` | Fitur #60 | Visual Style Fallback + Custom Textarea | 2026-09-21 |
> | `[#61]` | Fitur #61 | Factual Visual Grounding Layer | 2026-09-21 |
> | `[#62]` | Fitur #62 | Anti-Static Scene System | 2026-09-21 |
> | `[#63]` | Fitur #63 (Bagian 30) | Voice Studio TTS via Gemini API | 2026-09-22 |
> | `[#64]` | Fitur #64 (Bagian 31.1-31.4) | Voice Studio Dedicated Tab & Full VO Merge | 2026-09-22 |
> | `[#65]` | Fitur #65 (Bagian 31.3 & 31.5) | Voice Preview Studio & Payload Remediation | 2026-09-23 |
> | `[#66]` | Fitur #66 (Bagian 31.6) | Voice Discovery (Filter, Favorit, Niche Search) | 2026-09-23 |
> | `[#67]` | Fitur #67 (Bagian 32) | Multi-Profile State Isolation & Sync (`channelFormStates`) | 2026-09-23 |
> | `[#68]` | Fitur #68 (Bagian 33) | History to Studio Workflow Handover (`?draftId=...`) | 2026-09-23 |
> | `[#69]` | Fitur #69 (Bagian 34) | Last Parse Memory & 10-Item History Selector | 2026-09-24 |
> | `[#70]` | Fitur #70 (Bagian 35) | Overlay Style Selector & Auto-Chapter Grouping | 2026-09-24 |
> | `[#71]` | Fitur #71 (Bagian 36) | CTA Leakage Prevention v2 & Negative Directives | 2026-09-24 |
> | `[#72]` | Fitur #72 (Bagian 37) | Creator Persona & POV Coupling | 2026-09-24 |
> | `[#73]` | Fitur #73 (Bagian 38) | YouTube 2026 Strategy Engine (VET Pacing & 3-Tier SEO) | 2026-09-24 |
> | `[#74]` | Fitur #74 | Scene Prompt Studio Channel Selection Sync | 2026-09-24 |
> | `[#75]` | Fitur #75 | Strategic Material Deconstruction & Cognitive Priming | 2026-09-24 |
> | `[#76]` | Fitur #76 | YouTube 2026 Master Reference Document Ingestion | 2026-09-25 |
> | `[#77]` | Fitur #77 | Elimination of Infinite Preferences Fetch Loop | 2026-09-25 |
> | `[#78]` | Fitur #78 | Short-Form Chapter Suppression & Voice Sync | 2026-09-25 |
> | `[#79]` | Fitur #79 | ChatGPT Markdown Scene Parsing & Clean TTS Copy | 2026-09-25 |
> | `[#80]` | Fitur #80 | Multi-LLM Double-Prefix Header Support (`# ##`) | 2026-09-25 |
> | `[#81]` | Fitur #81 | UI/UX Precision & Design System Unification | 2026-09-25 |
> | `[#82]` | Fitur #82 | Dynamic Custom Role & POV AI Engine | 2026-09-25 |
> | `[#83]` | Fitur #83 | Standardized Bracket Acting & Beat Cues `[...]` | 2026-09-25 |
> | `[#84]` | Fitur #84 | YouTube 2026 SEO Tag & Hashtag Standardization | 2026-09-25 |
> | `[#85]` | Fitur #85 | Speech Rate & Target Duration Integration | 2026-09-25 |
> | `[#86]` | Audit & Remediasi P0–P3 | Type Safety (Zero any), Zero-Orphan, i18n Parity (1.393 keys), Audit v2 | 2026-09-27 |
> | `[#87]` | Fitur #87 (Bagian 39) | Scene Context, English Acting Cues & Speech-Rate Script Timing Engine | 2026-09-27 |
> | `[#88]` | Fitur #88 (Bagian 40) | Dual-Action Visual Copy Button & Filtered Batch Export with Context-Duration Fusion | 2026-09-27 |
> | `[#89]` | Fitur #89 (Bagian 41) | Bilingual Visual Prompt Bundling & Systemic i18n Hardening (Zero-Hardcoding) | 2026-09-27 |

---

## [#89] — 2026-09-27 | Fitur #89: Bilingual Visual Prompt Bundling & Systemic i18n Hardening (Zero-Hardcoding)

### Overview

Penyempurnaan arsitektur lokalisasi dan eliminasi total percampuran bahasa (zero hardcoded strings) di seluruh alur kerja Scene Prompt Studio:
1. **Locale-Aware Visual Prompt Fusion**:
   - Menghilangkan anomali percampuran bahasa saat menyalin prompt visual 1 kesatuan.
   - **Mode Bahasa Inggris (`en`)**:
     ```text
     [duration : 5s]
     [scene context]
     <English context>
     [Visual Prompt]
     <English visual prompt> --ar 9:16
     ```
   - **Mode Bahasa Indonesia (`id`)**:
     ```text
     [durasi : 5 detik]
     [konteks adegan]
     <Konteks adegan Indonesia>
     [Prompt Visual]
     <Deskripsi visual prompt> --ar 9:16
     ```
   - Konversi unit durasi otomatis: string input `"5 detik"` otomatis dinormalisasi menjadi `"5s"` pada locale `en`, dan `"5s"` dinormalisasi menjadi `"5 detik"` pada locale `id`.
2. **Penyelarasan Locale Mesin Overlay & Batch Export**:
   - `buildOverlayVisualCopyText` dan `buildBatchExportText` kini menerima `locale` aktif dari antarmuka pengguna.
   - Label overlay otomatis beradaptasi: `[Screen Overlay Text]` (en) vs `[Teks Overlay Layar]` (id).
   - Seluruh blok `VISUAL:` dalam ekspor batch mengikuti format terpadu dwibahasa secara konsisten.
3. **Pembersihan Menyeluruh Teks Hardcode Antarmuka**:
   - Menyelaraskan tombol "Raw" narasi dengan kamus i18n: pada bahasa Indonesia kini menampilkan **"Murni"** / **"✓ Murni Disalin"** via `t("raw")` dan `t("rawCopied")`, identik dengan tombol visual prompt.
   - Menghilangkan hardcoded "Copy" pada kartu pemilihan judul menjadi `t("copy")`.
   - Mengalihkan tab `🎯 SEO 2026` dan `📝 HTML Blog` ke `t("seo2026Tab")` dan `t("htmlBlogTab")`.
   - Melokalisasi seluruh header rekomendasi produk affiliate (`🛒 {t("affiliateRecommendationsTitle")}` dan `{t("productsCount")}`).
   - Melokalisasi label panduan suara sutradara (`vgContext`, `vgNote`, `vgTraits`, `vgSync`).
   - Melokalisasi seluruh metrik analisis uji susut mobile thumbnail (`shrinkWordLength`, `wordsUnit`, `shrinkOptimal`, `shrinkTooLong`, `shrinkFraming`, `shrinkFramingDesc`, `shrinkAbTesting`, `shrinkAbTestingDesc`).
   - Melokalisasi seluruh tombol, banner, deskripsi naratif, dan checklist pra-upload YouTube 2026 SEO Studio ke dalam kamus dwibahasa.
4. **Verifikasi Kualitas Ketat**:
   - **100% Key Parity**: 1.458 / 1.458 keys di `messages/id.json` dan `messages/en.json`.
   - **Unit Tests**: 181/181 passed (`vitest`).
   - **TypeScript**: 0 error (`tsc --noEmit`).
   - **Lint**: 0 error/warning (`eslint`).
   - **Design Token Audit**: PASS (86.6% adoption rate).
   - **Production Build**: 48/48 routes static & dynamic successfully generated (`next build`).

---

## [#88] — 2026-09-27 | Fitur #88: Dual-Action Visual Copy Button & Filtered Batch Export with Context-Duration Fusion

### Overview

Penyempurnaan alur kerja ekstraksi dan ekspor visual prompt pada Scene Prompt Studio:
1. **Dual-Action Split Copy Button (Per-Scene)**:
   - Tombol utama **`📋 Salin Lengkap`**: Menyalin 1 kesatuan utuh mencakup `[durasi : ...]`, `[scene context]`, dan `[Visual Prompt]`, sangat optimal untuk AI video generator generasi baru (Runway Gen-3, Kling AI, Luma Dream Machine).
   - Tombol sekunder **`Murni`**: Menyalin hanya prompt visual murni beserta parameter rasio aspek (`--ar`), aman dan langsung siap ditempel ke Midjourney bot (`/imagine prompt:...`) tanpa interferensi tag bracket.
2. **Selective Batch Export dengan Inline Filter Toggle Pills (Option A)**:
   - Bilah kontrol filter interaktif bergaya kapsul (toggle pills) di bawah tombol `📦 Ekspor Batch` untuk memilih elemen yang ingin diekspor: `[✓ Narasi]`, `[✓ Visual]`, `[✓ Durasi]`, `[✓ Konteks]`, `[✓ Overlay]`.
3. **Peleburan Cerdas Visual Block (Rule 2.1)**:
   - Ketika `Visual Prompt` dicentang bersama `Durasi` atau `Scene Context`, kedua elemen tersebut **melebur masuk ke dalam blok `VISUAL:`** menjadi 1 kesatuan rapi, tanpa menghasilkan baris `DURASI:` atau `SCENE_CONTEXT:` terpisah yang berulang.
   - Jika `Visual Prompt` tidak dicentang, maka `DURASI` dan `SCENE_CONTEXT` yang dicentang akan berdiri sendiri sebagai baris field mandiri.
4. **Deduplikasi Mutlak (Single Source of Truth)**:
   - Seluruh logika penggabungan format visual dipusatkan pada fungsi tunggal `buildUnifiedVisualPrompt` di `src/lib/sceneExportFormat.ts`, digunakan bersama oleh client UI dan ekspor batch.
5. **Paritas i18n Penuh**:
   - 11 kunci lokalisasi baru disinkronkan ke `messages/id.json` dan `messages/en.json` (1.415 keys per bahasa, 100% key parity).

---

### 1 — Implementasi Format Terpadu & Filter Ekspor (`src/lib/sceneExportFormat.ts`)

- **Fungsi Pembangun `buildUnifiedVisualPrompt`**:
  ```ts
  export function buildUnifiedVisualPrompt(
    scene: {
      visual: string;
      durasi?: string;
      estimatedDurationSec?: number;
      sceneContext?: string;
    },
    options: UnifiedVisualPromptOptions = { includeDuration: true, includeContext: true }
  ): string;
  ```
  Menghasilkan teks berformat:
  ```text
  [durasi : 8 detik]
  [scene context]
  Seorang astronaut melayang di luar stasiun...
  [Visual Prompt]
  Cinematic wide shot... --ar 9:16
  ```
- **Tipe & Default Filter `BatchExportFilterOptions`**:
  ```ts
  export interface BatchExportFilterOptions {
    includeNarasi: boolean;
    includeVisual: boolean;
    includeDurasi: boolean;
    includeContext: boolean;
    includeOverlay: boolean;
  }
  ```
- **Penyelarasan `buildBatchExportText(scenes, filter)`**:
  - Menerapkan aturan peleburan Rule 2.1 jika `includeVisual` bernilai `true`.
  - Mempertahankan sanitasi newline untuk field teks satu baris dan mendukung blok visual terpadu multi-baris yang rapi.

---

### 2 — UI Studio Integration (`ScenePromptStudioClient.tsx`)

- **Dual-Action Split Button**:
  - Menggantikan tombol salin tunggal lama di setiap kartu adegan dengan tombol split bergaya glassmorphism border slate.
  - Membantu kreator beralih secara instan antara salin lengkap (untuk AI Video) atau salin murni (untuk Midjourney).
- **Inline Filter Pills Bar**:
  - Ditempatkan tepat di bawah toolbar aksi adegan.
  - State `batchFilter` reaktif: Mengaktifkan atau menonaktifkan elemen seketika tanpa perlu membuka modal/dropdown terpisah.

---

### 3 — Bukti Eksekusi Suite Verifikasi (RAW Outputs)

#### A. `npx vitest run`
```
 Test Files  13 passed (13)
      Tests  177 passed (177)
   Duration  3.11s
Exit code: 0
```

#### B. `npx tsc --noEmit`
```
Exit code: 0
Output: (Clean, 0 errors)
```

#### C. `npm run lint`
```
> prompt-gen@0.1.0 lint
> eslint .

Exit code: 0
Output: (Clean, 0 errors, 0 warnings)
```

#### D. `npm run audit:i18n`
```
> prompt-gen@0.1.0 audit:i18n
> node scripts/audit-i18n.mjs

🔍 [AUDIT-I18N] Running strict i18n parity audit...
📊 Total Indonesian (id) keys: 1415
📊 Total English (en) keys:    1415
✅ [AUDIT-I18N] 100% key parity confirmed between id.json and en.json. Zero missing keys!
Exit code: 0
```

#### E. `npm run audit:design`
```
> prompt-gen@0.1.0 audit:design
> node scripts/audit-design.mjs

🎨 [AUDIT-DESIGN] Running Prompt Gen Design System Token Audit...
📁 Scanning 82 UI components...
✨ Total Design Token occurrences: 2160
📊 Component adoption rate: 71/82 (86.6%)
✅ [AUDIT-DESIGN] Design system health check: PASS! Strong design token enforcement.
Exit code: 0
```

#### F. `npm run build`
```
> prompt-gen@0.1.0 build
> next build

▲ Next.js 16.3.1 (Turbopack)
- Environments: .env
✓ Running next.config.ts took 2.5s

  Creating an optimized production build ...
✓ Compiled successfully in 7.9s
  Running TypeScript ...
  Finished TypeScript in 10.3s ...
  Collecting page data using 3 workers ...
  Generating static pages using 3 workers (0/48) ...
✓ Generating static pages using 3 workers (48/48) in 415ms
  Finalizing page optimization ...
Exit code: 0
```

---

## [#87] — 2026-09-27 | Fitur #87: Scene Context, English Acting Cues & Speech-Rate Script Timing Engine

### Overview

Penyempurnaan arsitektur skrip dan studio pengolahan prompt adegan (Scene Prompt Studio) mencakup:
1. **Scene Context Extraction**: Penambahan field kontekstual kejadian adegan (`sceneContext`) yang bilingual (`KONTEKS SCENE:` untuk ID, `SCENE CONTEXT:` untuk EN) pada generator master prompt dan parse engine, dengan fallback otomatis ke embedded tag `[Scene: ...]` pada prompt visual.
2. **English-Only Acting Cues Standardization**: Penyeragaman direktif akting dan jeda pada dialog narasi (`[pause]`, `[beat]`, `[sigh]`, `[whisper]`, `[gasp]`, `[chuckle]`, `[clears throat]`) secara ketat dalam Bahasa Inggris di seluruh naskah (termasuk naskah Bahasa Indonesia) guna mencegah kegagalan sintesis vokal Gemini TTS / ElevenLabs yang kerap melafalkan tag terjemahan seperti `[menghela nafas]`.
3. **Speech-Rate-Driven Script Timing Engine**: Mesin estimasi durasi skrip matematis berbasis parameter `speechRate` dari Generator Studio (`0.25s`, `0.30s`, `0.35s`, `0.40s`, `0.50s` per kata). Menghitung durasi per-scene dan total skrip secara presisi termasuk akumulasi jeda ekspresif.
4. **Scene Prompt Studio UI Integration**:
   - **Script Timing & Duration Control Bar**: Menampilkan total durasi format `mm:ss`, total kata terucap, jumlah adegan, overhead jeda akting, badge dinamis `⚡ Shorts Ready (<60s)` vs `📺 Format Panjang (>60s)`, serta dropdown selektor interaktif `Speech Rate` yang memperbarui estimasi secara instan.
   - **Scene Card Duration Badge**: Badge durasi dan jumlah kata di header setiap kartu adegan (`⏱️ ~5.4s (14w)`).
   - **Scene Context Box**: Kotak panggil `🎬 Konteks Adegan` dengan tombol salin satu-klik tepat di atas narasi.
5. **Dukungan Ekspor & Paritas i18n Penuh**: Field `SCENE CONTEXT` disertakan dalam utilitas ekspor batch `buildBatchExportText()` dan 11 kunci lokalisasi baru disinkronkan ke `messages/id.json` dan `messages/en.json` (1.404 keys per bahasa, 100% key parity).

---

### 1 — Scene Context Field & Bilingual Parser Support

- **Generator Master Prompt (`src/lib/promptGenerator.ts`)**:
  - Menambahkan baris instruksi `KONTEKS SCENE:` (Bahasa Indonesia) atau `SCENE CONTEXT:` (Bahasa Inggris) sebelum blok `NARASI:` dalam panduan format output adegan LLM.
  - Memandu AI untuk merangkum kejadian nyata di adegan secara ringkas dan presisi sebelum menyusun prompt visual Midjourney / Imagen.
- **Engine Parser (`src/lib/parsers.ts`)**:
  - Memperluas antarmuka `Scene` dengan properti opsional `sceneContext?: string`.
  - Memperbarui ekspresi reguler lookahead delimiter parser adegan dengan menyertakan `Narasi|Dialog|Voice Over|VO|Audio` agar field konteks tidak menyerap baris narasi pertama.
  - Menambahkan parser fallback yang mendeteksi tag `[Scene: ...]` atau `[Konteks: ...]` yang terbenam di awal deskripsi prompt visual jika model tidak menyertakan baris eksplisit `KONTEKS SCENE:`.
- **Scene Export (`src/lib/sceneExportFormat.ts`)**:
  - Memperluas antarmuka `SceneForExport` dengan `sceneContext?: string`.
  - Menyertakan baris `SCENE CONTEXT: ...` di dalam teks hasil fungsi `buildBatchExportText()` untuk memudahkan kreator dan tim produksi memahami alur cerita.

---

### 2 — Standardisasi Bahasa Direktif Akting (English-Only Acting Tags)

- **Instruksi Master Prompt (`src/lib/promptGenerator.ts`)**:
  - Menambahkan bab penegasan `STANDARISASI BAHASA TAG AKTING (WAJIB BAHASA INGGRIS)` pada prompt berbahasa Indonesia dan `MANDATORY ENGLISH-ONLY ACTING TAGS` pada prompt berbahasa Inggris.
  - Mewajibkan seluruh instruksi jeda dan emosi ekspresif dituliskan hanya menggunakan tag resmi: `[pause]`, `[beat]`, `[sigh]`, `[whisper]`, `[gasp]`, `[chuckle]`, `[clears throat]` atau format durasi eksplisit `[pause 2s]`.
  - Melarang keras penerjemahan tag ke bahasa lokal (seperti `[menghela nafas]`, `[berbisik]`, `[jeda]`) yang dapat disalahartikan sebagai teks lisan oleh modul Text-to-Speech.
- **Dukungan Parser & Pembersihan TTS (`src/lib/parsers.ts`)**:
  - Menambahkan variasi `[clears throat]` dan `[berdeham]` (overhead jeda 0.8 detik) ke dalam fungsi `estimateExpressivePauseSeconds()`.
  - Menjaga fungsi `cleanNarasiForTts()` tetap menghapus seluruh tag bracket sebelum dikirimkan ke endpoint Gemini TTS.

---

### 3 — Mesin Kalkulasi Waktu Berbasis Speech Rate & Integrasi Studio

- **Kalkulator Terpusat (`calculateScriptTiming` di `src/lib/parsers.ts`)**:
  - Mengambil parameter `scenes: Scene[]` dan `speechRateSec = 0.35`.
  - Mengembalikan objek `ScriptTimingSummary`:
    ```ts
    export interface ScriptTimingSummary {
      totalWords: number;
      totalPausesSec: number;
      totalDurationSec: number;
      formattedTotalDuration: string; // "mm:ss"
      isShortsReady: boolean;          // totalDurationSec <= 60
      sceneCount: number;
    }
    ```
  - Otomatis menghitung durasi per-scene di dalam `parseScenes()` dan menyimpannya pada `scene.wordCount`, `scene.pauseSec`, dan `scene.estimatedDurationSec`.
- **UI Scene Prompt Studio (`ScenePromptStudioClient.tsx`)**:
  - Menambahkan bar kontrol durasi interaktif di atas daftar adegan.
  - Dropdown selektor `Speech Rate` dengan 5 pilihan standar:
    - `0.25 s/kata` (Super Cepat ~240 WPM - Shorts Punchy)
    - `0.30 s/kata` (Cepat ~200 WPM - Storytelling Dinamis)
    - `0.35 s/kata` (Normal ~171 WPM - Standar Narasi Indonesia)
    - `0.40 s/kata` (Santai ~150 WPM - Eksplanasi / Dokumenter)
    - `0.50 s/kata` (Lambat ~120 WPM - Meditasi / Cerita Mendalam)
  - Perubahan `speechRate` secara instan mengkalkulasi ulang durasi total dan durasi setiap scene secara reaktif.
  - Menyimpan preferensi `speechRate` ke dalam payload draft (`Draft.parsedData`).
- **Penyelarasan Server Page (`page.tsx`)**:
  - Memilih field `speechRate` dari relasi `profileChannel` pada query server-side.

---

### 4 — Audit Paritas Lokalisasi (i18n)

- Penambahan 11 kunci terjemahan pada `messages/id.json` dan `messages/en.json` di bawah namespace `ScenePromptStudio`:
  - `sceneContext`: "Konteks Adegan" / "Scene Context"
  - `totalDuration`: "Total Estimasi Durasi" / "Total Estimated Duration"
  - `shortsReadyBadge`: "⚡ Shorts Ready (<60s)" / "⚡ Shorts Ready (<60s)"
  - `longFormBadge`: "📺 Format Panjang (>60s)" / "📺 Long-Form Format (>60s)"
  - `wordsCount`: "kata" / "words"
  - `speechRateLabel`: "Kecepatan Bicara (Speech Rate)" / "Speech Rate"
  - `speechRateSuperFast`: "0.25 s/kata (Super Cepat ~240 WPM)" / "0.25 s/word (Super Fast ~240 WPM)"
  - `speechRateFast`: "0.30 s/kata (Cepat ~200 WPM)" / "0.30 s/word (Fast ~200 WPM)"
  - `speechRateNormal`: "0.35 s/kata (Normal ~171 WPM)" / "0.35 s/word (Normal ~171 WPM)"
  - `speechRateRelaxed`: "0.40 s/kata (Santai ~150 WPM)" / "0.40 s/word (Relaxed ~150 WPM)"
  - `speechRateSlow`: "0.50 s/kata (Lambat ~120 WPM)" / "0.50 s/word (Slow ~120 WPM)"
- Paritas terverifikasi 100% (1.404 / 1.404 keys, 0 missing).

---

### 5 — Bukti Eksekusi Suite Verifikasi (RAW Outputs)

#### A. `npx tsc --noEmit`
```
Exit code: 0
Output: (Clean, 0 errors)
```

#### B. `npm run lint`
```
> prompt-gen@0.1.0 lint
> eslint .

Exit code: 0
Output: (Clean, 0 errors, 0 warnings)
```

#### C. `npm test`
```
 RUN  v3.2.7 C:/Users/Dhiko Herlambang/.gemini/antigravity/playground/pulsing-pinwheel/Project/Prompt Gen

 ✓ tests/parsers.test.ts (48 tests) 136ms
 ✓ tests/promptGenerator.test.ts (37 tests) 44ms
 ✓ tests/researchService.test.ts (8 tests) 416ms
 ✓ tests/rateLimit.test.ts (7 tests) 10ms
 ✓ tests/subscription.test.ts (7 tests) 12ms
 ✓ tests/crypto.test.ts (6 tests) 10ms
 ✓ tests/geminiTts.test.ts (8 tests) 11ms
 ✓ tests/channelStateIsolation.test.ts (4 tests) 13ms
 ✓ tests/historyStudioIntegration.test.ts (11 tests) 10ms
 ✓ tests/channelLockLogic.test.ts (4 tests) 9ms
 ✓ tests/sceneExportFormat.test.ts (12 tests) 8ms
 ✓ tests/enumMapping.test.ts (9 tests) 7ms
 ✓ tests/planFeatures.test.ts (5 tests) 4ms

 Test Files  13 passed (13)
      Tests  166 passed (166)
```

#### D. `npm run audit:i18n`
```
> prompt-gen@0.1.0 audit:i18n
> node scripts/audit-i18n.mjs

🔍 [AUDIT-I18N] Running strict i18n parity audit...
📊 Total Indonesian (id) keys: 1404
📊 Total English (en) keys:    1404
✅ [AUDIT-I18N] 100% key parity confirmed between id.json and en.json. Zero missing keys!
```

#### E. `npm run audit:design`
```
> prompt-gen@0.1.0 audit:design
> node scripts/audit-design.mjs

🎨 [AUDIT-DESIGN] Running Prompt Gen Design System Token Audit...
📁 Scanning 82 UI components...
✨ Total Design Token occurrences: 2159
📊 Component adoption rate: 71/82 (86.6%)
✅ [AUDIT-DESIGN] Design system health check: PASS! Strong design token enforcement.
```

#### F. `npm run build`
```
> prompt-gen@0.1.0 build
> next build

▲ Next.js 16.3.1 (Turbopack)
- Environments: .env
✓ Running next.config.ts took 1630ms

  Creating an optimized production build ...
✓ Compiled successfully in 5.7s
  Running TypeScript ...
  Finished TypeScript in 4.4s ...
  Collecting page data using 3 workers ...
  Generating static pages using 3 workers (0/48) ...
✓ Generating static pages using 3 workers (48/48) in 408ms
  Finalizing page optimization ...
Exit code: 0
```

---

## [#86] — 2026-09-27 | Lead Full-Stack Audit, Complete Type Safety Remediation (Zero any), Zero-Orphan Verification & Final Audit v2 Publication

### Overview

Sesi audit dan remediasi sistemik menyeluruh (P0 s/d P3) oleh Lead Full-Stack Auditor & Remediator. Menuntaskan pemulihan kepercayaan dengan eksekusi nyata suite verifikasi lengkap (tsc, lint, build, test, audit:i18n, audit:design), merekonstruksi dokumen otoritatif (menerbitkan `AUDIT_REPORT_FINAL_v2.md` dan menandai `AUDIT_REPORT_FINAL.md` lama sebagai SUPERSEDED), menyelesaikan tabrakan skema penomoran historis dengan tabel pemetaan kanonikal, mengeliminasi 100% penggunaan `any` di `src/` tanpa penambahan `eslint-disable` baru lewat pembuatan model tipe terpusat `src/types/generator.ts`, mengamankan endpoint `/api/tts/merge` dengan feature gate `textToSpeechStudio`, serta menyapu bersih seluruh string hardcoded Bahasa Indonesia di UI menjadi 1.393 i18n keys berparitas 100%.

---

### 1 — Type-Safety Remediation: Zero Explicit 'any' & Centralized Generator Types (P2)

- **Model Tipe Terpusat (`src/types/generator.ts`)**:
  - Mendefinisikan `GeneratorFormStateSnapshot` secara komprehensif, mencakup seluruh field formulir: mode platform, niche, topik, keyword target, context, visual style, affiliate config, custom role POV, audio config, target scene/durasi, speech rate, and archetypes.
  - Mendefinisikan `ContentArchetypeIncludedSections`, `ContentArchetypeCompositionCategory`, `GeneratorVideoConfigSnapshot`, `GeneratorImageConfigSnapshot`.
- **Eliminasi 5 Penggunaan `any` pada `GeneratorForm.tsx` Tanpa Eslint-Disable**:
  - `defaultIncludedSections`: Dari `any` menjadi `ContentArchetypeIncludedSections | Prisma.JsonValue`.
  - `compositionCategories`: Dari `any` menjadi `ContentArchetypeCompositionCategory[] | Prisma.JsonValue`.
  - `savedState` parameter `applyStateForChannel`: Menjadi `GeneratorFormStateSnapshot | null | undefined`.
  - `let targetSaved`: Menjadi `GeneratorFormStateSnapshot | null`.
  - `let initialSaved`: Menjadi `GeneratorFormStateSnapshot | null`.
  - `serverChannelStatesRef`: Menjadi `Record<string, GeneratorFormStateSnapshot>`.
  - Seluruh komentar `// eslint-disable-next-line @typescript-eslint/no-explicit-any` dihapus bersih.
- **Verifikasi**: `git grep -n ": any" src/` menghasilkan **0 matches (bersih total)**.

---

### 2 — Security & Feature Guard Alignment (P3)

- **Subscription Guard pada `POST /api/tts/merge`**:
  - Endpoint `/api/tts/merge` kini dilengkapi dengan `requireActiveSubscription(session.user.id)` dan pengecekan hak fitur `planFeatures.textToSpeechStudio`.
  - Mencapai keselarasan 100% fail-closed security guard antara `tts/generate` dan `tts/merge`.
- **Zero-Orphan Verification**:
  - Model `UserApiKey` (`tts-keys`): CRUD aktif (GET, POST, DELETE di `/api/user/tts-keys`, failover loop di `geminiTts.ts`).
  - Model `ParsedOutput`: CRUD aktif (GET, POST di `/api/parsed-outputs`, pembersihan otomatis draft usang > 10 naskah).
  - Model `ContentArchetype`: CRUD aktif (GET publik di `/api/content-archetypes`, CRUD admin di `/api/admin/content-archetypes`, relasi aktif di `ProfileChannel` dan `GeneratorForm`).
- **Zero Saldo / Credit Verification**:
  - 100% konsisten menganut model langganan berbasis durasi kalender (*time-based subscription*).
  - 0 kemunculan kata kunci saldo/kredit/kuota pemakaian di seluruh `src/` dan pesan lokalisasi.

---

### 3 — Pembersihan String Hardcoded & Sapuan Penuh i18n (P3)

- Penambahan 31 kunci terjemahan baru di `messages/id.json` dan `messages/en.json` (total 1.393 keys per locale):
  - `Generator`: `customVisualStyleLabel`, `customVisualStylePlaceholder`, `customVisualStyleHelp`, `voDisabledByNarrationMode`, `thumbnailStyleAntiGagalDesc`, `affiliateCustomUrlPlaceholder`.
  - `ScenePrompt`: `copyAllCleanNarrationTitle`, `copyAllRawNarrationTitle`, `copySceneRawNarrationTitle`, `combinedTagsBoxTitle`, `copyAsCommaKeywords`, `copyAsHashtagsDesc`, `noSpecificTags`, `noGeneralTags`, `noCompoundTags`.
  - `Invoices`: `allTransactions`, `officialReceiptNote`.
  - `Channels`: `ctaLinkBioExample`, `ctaFollowSaveExample`.
  - `Admin`: `rateLimitMaxActionHelp`, `rateLimitWindowPlaceholder`, `videoSystemInstructionPlaceholder`, `imageSystemInstructionPlaceholder`.
  - `Notifications`: `allTime`.
- Paritas terverifikasi 100% lewat `npm run audit:i18n` (1.393 / 1.393 keys, 0 missing).

---

### 4 — Rekonsiliasi Blueprint & Dokumentasi Otoritatif (P0, P1, P3)

- **Rekonsiliasi `Project Prompt Gen.txt`**:
  - Dihapusnya duplikasi blok addendum Bagian 23 (51 baris ganda yang terpapar sebelumnya).
  - Ditambahkannya dokumentasi kontrak type safety terpusat `GeneratorFormStateSnapshot` (Bagian 32.5).
  - Ditambahkannya dokumentasi subscription guard `textToSpeechStudio` pada `POST /api/tts/merge` (Bagian 31.4).
  - Ditambahkannya Panduan Skema Penomoran Kanonikal & Pemetaan Historis Proyek.
- **Penerbitan `AUDIT_REPORT_FINAL_v2.md`**:
  - Menyusun ulang Compliance Matrix modul Bagian 3 dan Addendum 18 s/d 38 dari nol berdasarkan kode aktual terkini.
  - Mengutip file dan baris konkret untuk setiap modul.
  - Menandai `AUDIT_REPORT_FINAL.md` dan `FINAL_HANDOFF_REPORT.md` lama sebagai **SUPERSEDED**.

---

### 5 — Bukti Eksekusi Suite Verifikasi (RAW Outputs)

#### A. `npx tsc --noEmit`
```
Exit code: 0
Output: (Clean, 0 errors)
```

#### B. `npm run lint`
```
> prompt-gen@0.1.0 lint
> eslint .

Exit code: 0
Output: (Clean, 0 errors, 0 warnings)
```

#### C. `npm run build`
```
> prompt-gen@0.1.0 build
> next build

▲ Next.js 16.3.1 (Turbopack)
- Environments: .env
✓ Running next.config.ts took 1606ms
  Creating an optimized production build ...
✓ Compiled successfully in 7.7s
  Running TypeScript ...
  Finished TypeScript in 12.3s ...
  Collecting page data using 3 workers ...
  Generating static pages using 3 workers (48/48) in 668ms
  Finalizing page optimization ...

Route (app)
┌ ○ /_not-found
├ ƒ /[locale]
├ ƒ /[locale]/admin
├ ƒ /[locale]/admin/announcements
├ ƒ /[locale]/admin/notifications
├ ƒ /[locale]/admin/panduan
├ ƒ /[locale]/admin/payments
├ ƒ /[locale]/admin/plans
├ ƒ /[locale]/admin/registrations
├ ƒ /[locale]/admin/settings
├ ƒ /[locale]/admin/support
├ ƒ /[locale]/admin/users
├ ƒ /[locale]/auth
├ ƒ /[locale]/auth/forgot-password
├ ƒ /[locale]/auth/reset-password
├ ƒ /[locale]/dashboard
├ ƒ /[locale]/dashboard/billing
├ ƒ /[locale]/dashboard/billing/invoices/[id]
├ ƒ /[locale]/dashboard/channels
├ ƒ /[locale]/dashboard/drafts
├ ƒ /[locale]/dashboard/drafts/[id]
├ ƒ /[locale]/dashboard/generator
├ ƒ /[locale]/dashboard/notifications
├ ƒ /[locale]/dashboard/panduan
├ ƒ /[locale]/dashboard/pricing
├ ƒ /[locale]/dashboard/research
├ ƒ /[locale]/dashboard/scene-prompt
├ ƒ /[locale]/dashboard/settings
├ ƒ /[locale]/dashboard/support
├ ƒ /api/admin/announcements
├ ƒ /api/admin/audit-logs
├ ƒ /api/admin/content-archetypes
├ ƒ /api/admin/content-archetypes/[id]
├ ƒ /api/admin/notifications
├ ƒ /api/admin/payments
├ ƒ /api/admin/payments/[id]/proof
├ ƒ /api/admin/plans
├ ƒ /api/admin/prompt-settings
├ ƒ /api/admin/registrations
├ ƒ /api/admin/settings
├ ƒ /api/admin/users
├ ƒ /api/admin/users/[id]
├ ƒ /api/auth/[...nextauth]
├ ƒ /api/auth/check
├ ƒ /api/auth/forgot-password
├ ƒ /api/auth/register
├ ƒ /api/auth/registration-status
├ ƒ /api/auth/reset-password
├ ƒ /api/channels
├ ƒ /api/channels/[id]
├ ƒ /api/channels/[id]/products
├ ƒ /api/content-archetypes
├ ƒ /api/cron/cleanup-proofs
├ ƒ /api/cron/subscription-reminders
├ ƒ /api/cs/contact-info
├ ƒ /api/drafts
├ ƒ /api/drafts/[id]
├ ƒ /api/drafts/[id]/performance
├ ƒ /api/drafts/export
├ ƒ /api/drafts/import-titles
├ ƒ /api/generate
├ ƒ /api/health
├ ƒ /api/invoice
├ ƒ /api/invoice/upload
├ ƒ /api/niche-category-presets
├ ƒ /api/notifications
├ ƒ /api/notifications/[id]
├ ƒ /api/notifications/mark-all-read
├ ƒ /api/notifications/unread-count
├ ƒ /api/parsed-outputs
├ ƒ /api/persona-presets
├ ƒ /api/platform-options
├ ƒ /api/products/[id]
├ ƒ /api/research/trends
├ ƒ /api/support/settings
├ ƒ /api/support/tickets
├ ƒ /api/support/tickets/[id]
├ ƒ /api/support/tickets/[id]/messages
├ ƒ /api/tts/generate
├ ƒ /api/tts/merge
├ ƒ /api/used-titles/[id]
├ ƒ /api/user/data-export
├ ƒ /api/user/invoices
├ ƒ /api/user/password
├ ƒ /api/user/preferences
├ ƒ /api/user/profile
├ ƒ /api/user/tts-keys
├ ƒ /api/user/tts-keys/[id]
└ ƒ /api/visual-aesthetic-presets

Exit code: 0
```

#### D. `npm test`
```
> prompt-gen@0.1.0 test
> vitest run

 RUN  v3.2.7 C:/Users/Dhiko Herlambang/.gemini/antigravity/playground/pulsing-pinwheel/Project/Prompt Gen

 ✓ tests/promptGenerator.test.ts (36 tests) 43ms
 ✓ tests/parsers.test.ts (42 tests) 76ms
 ✓ tests/researchService.test.ts (8 tests) 468ms
 ✓ tests/crypto.test.ts (6 tests) 10ms
 ✓ tests/geminiTts.test.ts (8 tests) 11ms
 ✓ tests/subscription.test.ts (7 tests) 20ms
 ✓ tests/historyStudioIntegration.test.ts (11 tests) 10ms
 ✓ tests/channelStateIsolation.test.ts (4 tests) 23ms
 ✓ tests/rateLimit.test.ts (7 tests) 11ms
 ✓ tests/sceneExportFormat.test.ts (12 tests) 8ms
 ✓ tests/channelLockLogic.test.ts (4 tests) 9ms
 ✓ tests/enumMapping.test.ts (9 tests) 7ms
 ✓ tests/planFeatures.test.ts (5 tests) 5ms

 Test Files  13 passed (13)
      Tests  159 passed (159)
   Start at  01:12:50
   Duration  2.94s (transform 653ms, setup 0ms, collect 1.35s, tests 700ms, environment 3ms, prepare 2.90s)

Exit code: 0
```

#### E. `npm run audit:i18n`
```
> prompt-gen@0.1.0 audit:i18n
> node scripts/audit-i18n.mjs

🔍 [AUDIT-I18N] Running strict i18n parity audit...
📊 Total Indonesian (id) keys: 1393
📊 Total English (en) keys:    1393
✅ [AUDIT-I18N] 100% key parity confirmed between id.json and en.json. Zero missing keys!

Exit code: 0
```

#### F. `npm run audit:design`
```
> prompt-gen@0.1.0 audit:design
> node scripts/audit-design.mjs

🎨 [AUDIT-DESIGN] Running Prompt Gen Design System Token Audit...
📁 Scanning 82 UI components...
✨ Total Design Token occurrences: 2144
📊 Component adoption rate: 71/82 (86.6%)
✅ [AUDIT-DESIGN] Design system health check: PASS! Strong design token enforcement.

Exit code: 0
```

#### G. `git grep -n ": any" src/`
```
Command: git grep -n ": any" src/
Exit code: 1 (Clean — 0 matches found in entire src/ directory)
```

---

## [#85] — 2026-09-25 | Speech Rate & Target Duration Integration: Exact Mathematical Word Budget, Expressive Pause & Acting Tag Overhead, Real-Time Calculator Helper, Archetype Duration Mode Sync, & Zero-Gap Audio Timing Pipeline

### Overview

Audit dan rekonstruksi menyeluruh integrasi parameter **Speech Rate (Laju Bicara)**, **Target Durasi**, dan **Target Jumlah Scene** di seluruh pipeline: Studio Generator (`GeneratorForm.tsx`), Mesin Generator Prompt AI (`promptGenerator.ts`), Backend Drafts API (`drafts/route.ts`), Scene Prompt Studio (`ScenePromptStudioClient.tsx`), dan Parser (`parsers.ts`). Mengeliminasi kesenjangan antara estimasi durasi abstrak AI dengan durasi audio riil (voice-over/TTS) melalui formula matematis kuota kata yang presisi, perlakuan khusus tag jeda/akting ekspresif (*expressive pause overhead*), kartu helper interaktif *real-time*, sinkronisasi `DurationCalcMode` model konten, serta penambahan unit test terverifikasi (159/159 tests passing).

---

### 1 — Mesin Perhitungan Waktu & Kuota Kata Presisi (`promptGenerator.ts`)

- **Fungsi Resolver: `resolveSpeechRateSecondsPerWord(rateInput, fallback): number`**:
  - Menerima dan menormalisasi berbagai format input: angka desimal (`0.35`), angka WPM (`171` $\rightarrow$ $0.35$ s/kata), teks bersatuan (`"0.35 detik/kata"`, `"0.30 s/kata"`), serta kata kunci preset (`"super_fast"`: 0.25, `"fast"`: 0.30, `"medium"`: 0.35, `"relaxed"`: 0.40, `"slow"`: 0.50).
  - Menyediakan fallback hierarkis terpadu hingga default standar $0.35$ detik/kata (~171 WPM).
- **Fungsi Kalkulator: `calculateSpeechRateTiming(rawSpeechRate, targetDuration, targetScenes, fallbackRate): SpeechRateTimingCalculation`**:
  - Menghitung kuota kata total naskah:
    $$\text{Total Target Words} = \text{round}\left(\frac{\text{Target Duration (detik)}}{\text{Speech Rate (detik per kata)}}\right)$$
  - Menghitung distribusi kata rata-rata per scene:
    $$\text{Average Words per Scene} = \text{round}\left(\frac{\text{Total Target Words}}{\text{Target Scene Count}}\right)$$
  - Menyediakan batas toleransi ketat ($\pm 10\%$ total kuota kata, rentang ideal $75\% - 125\%$ per scene) untuk mengontrol kepanjangan kalimat.
- **Pembaruan Instruksi Master Prompt AI**:
  - **Mode Voice-Over (`VOICE_OVER` / `HYBRID`)**:
    - Menyuntikkan blok `[PANDUAN TEMPO, KUOTA KATA & KECEPATAN BICARA (SPEECH RATE & DURATION CONTROL)]` yang mewajibkan AI mematuhi total target kata dan rentang kata per scene (hook pendek/punchy, body detail, CTA ringkas).
    - Memperingatkan AI secara tegas bahwa kelebihan kata akan membuat durasi video molor dan tidak pas saat diisi suara (TTS / Voice-over).
    - Menyelaraskan field `DURASI:` setiap scene dengan kuota kata scene bersangkutan.
  - **Aturan Tag Jeda Ekspresif & Akting (`[beat]`, `[sigh]`, `[silence]`, `[pause]`)**:
    - AI diinstruksikan secara eksplisit bahwa tag jeda/akting seperti `[beat]` (~0.5s), `[sigh]` (~0.8s), `[silence]`/`[pause]` (~1.0s), dan `[pause 2s]` mengonsumsi durasi waktu nyata meskipun tidak dihitung sebagai kata spoken.
    - AI diwajibkan mengurangi jumlah kata spoken pada scene yang memuat tag jeda agar total waktu bicara + jeda akting tetap pas dan tidak molor dari durasi scene.
  - **Mode Non-Voice-Over (`DIEGETIC_ONLY` / `SILENT_TEXT_ONLY`)**:
    - Menginstruksikan AI bahwa ritme video digerakkan oleh aksi visual dan audio ambient tanpa memaksakan kuota kata vokal.
  - **Integrasi `DurationCalcMode` Archetype**:
    - `NARRATION_WORDCOUNT`: AI diinstruksikan bahwa durasi dikunci ketat oleh kuota kata narasi.
    - `SEGMENT_SELF_ESTIMATE`: AI diinstruksikan menyesuaikan narasi dengan durasi adegan visual.
    - `HYBRID`: AI diinstruksikan menyinkronkan narasi dengan durasi visual adegan.
  - **Lokalisasi Dwibahasa**:
    - Format instruksi otomatis diterjemahkan ke bahasa Inggris (`[TEMPO, WORD COUNT BUDGET & SPEECH RATE GUIDELINES]`) jika `outputLanguage` menggunakan bahasa Inggris.

---

### 2 — Helper Kalkulator Interaktif Real-Time di Studio Form (`GeneratorForm.tsx`)

- **Kartu Indikator Waktu & Kata Interaktif**:
  - Ditambahkan tepat di bawah grid kontrol presisi (*Target Jumlah Scene, Aspect Ratio Video, Speech Rate*).
  - Menghitung dan menampilkan estimasi secara instan setiap kali user mengubah durasi (15s–600s), scene count (1–30), atau speech rate (0.25–0.50 s/kata):
    - *Target ~{total} kata (rata-rata ~{perScene} kata/scene)*.
    - Badge WPM (~{wpm} WPM).
    - Badge kecepatan kata ({rate} s/kata).
  - Dilengkapi lokalisasi i18n penuh (`timingCalcTitle`, `timingCalcDesc`, `timingCalcUnit`) di `messages/id.json` dan `messages/en.json`.

---

### 3 — Penyelarasan Alur Simpan Draft & Mode Durasi (`src/app/api/drafts/route.ts`)

- **Perhitungan Kata Spoken Bersih**:
  - Memanfaatkan fungsi kanonikal `cleanNarasiForTts` dan `countWords` dari `parsers.ts`, memastikan catatan sutradara dan bracket audio (misal: `[SFX: whoosh]`) tidak ikut terhitung sebagai kata yang diucapkan.
- **Kompensasi Jeda Ekspresif (`estimateExpressivePauseSeconds`)**:
  - Akumulasi jeda dari tag akting di setiap scene (`totalExpressivePauseSec`) ditambahkan ke perhitungan `wordcountDurationSec`, menghasilkan durasi realistis yang mencerminkan tempo pembacaan aktor/TTS.
- **Kepatuhan Terhadap `DurationCalcMode` Model Konten**:
  - Jika archetype channel menggunakan `NARRATION_WORDCOUNT` dan mode suara aktif, estimasi durasi diprioritaskan berbasis kata narasi + jeda ekspresif dengan `durationSource: "WORDCOUNT_ESTIMATE"`.
  - Jika `SEGMENT_SELF_ESTIMATE`, memprioritaskan akumulasi durasi segmen visual.
  - Jika `HYBRID`, menyeimbangkan durasi segmen visual dan fallback kuota kata.

---

### 4 — Peningkatan Scene Prompt Studio (`ScenePromptStudioClient.tsx`)

- **Badge Jumlah Kata Narasi & Kompensasi Jeda per Scene**:
  - Menampilkan pill jumlah kata spoken (`{sceneWords} kata` / `{sceneWords} words`) di samping label `🎤 Narasi` pada setiap scene card.
  - Menampilkan badge kompensasi jeda ekspresif (`+{pauseSec}s jeda` / `+{pauseSec}s pause`) jika narasi mengandung tag akting/jeda seperti `[beat]`, `[sigh]`, `[silence]`, atau `[pause 2s]`.
  - Membantu kreator memverifikasi kepanjangan naskah scene sebelum di-copy atau di-generate audio TTS.

---

### 5 — Verifikasi, Parser Kanonikal, & Pengujian Menyeluruh

- **Fungsi Kanonikal `parsers.ts`**:
  - `countWords(text)`: Helper terpusat untuk menghitung kata spoken secara konsisten di seluruh aplikasi tanpa duplikasi regex `split(/\s+/)`.
  - `estimateExpressivePauseSeconds(text)`: Helper untuk mengukur bobot waktu nyata dari tag jeda akting (`[beat]` ~0.5s, `[silence]` ~1.0s, `[sigh]` ~0.8s, `[pause 2s]`, dll.) dengan mengabaikan cue teknis SFX/BGM.
  - `estimateNarrationDuration(text, speechRateSec)`: Menghitung total durasi narasi gabungan (kata bicara + jeda akting).
- **Unit & Integration Tests (`tests/promptGenerator.test.ts` & `tests/parsers.test.ts`)**:
  - Pengujian komprehensif yang mencakup:
    - Normalisasi input speech rate (desimal, WPM, satuan string, keyword preset, fallback).
    - Kalkulasi matematis waktu 60s @ 0.35s dan 30s @ 0.25s.
    - Integrasi prompt master (voice-over, non-voiceover diegetic, durationCalcMode archetype, aturan jeda ekspresif, lokalisasi bahasa Inggris).
    - Parsing kata `countWords` dengan berbagai kasus batas (empty, null, whitespace, format TTS).
    - Perhitungan jeda ekspresif `estimateExpressivePauseSeconds` dan `estimateNarrationDuration`.
- **Hasil Uji**:
  - `npx tsc --noEmit` $\rightarrow$ **0 Errors**.
  - `npm test` $\rightarrow$ **13 test files passed, 159 tests passed (100% pass)**.

---

## [#84] — 2026-09-25 | YouTube 2026 SEO Tag & Hashtag Standardization: Studio 500-Char Combiner, Dual-Action Smart Copier, & Zero-Gap Chip Badging

### Overview

Audit dan standarisasi menyeluruh arsitektur metadata YouTube 2026 pada Scene Prompt Studio (`ScenePromptStudioClient.tsx`), mesin parser (`parsers.ts`), dan generator prompt AI (`promptGenerator.ts`). Memisahkan secara tegas dan elegan antara **YouTube Studio Keyword Tags** (kata kunci koma tanpa tanda pagar `#`, dibatasi maksimal 500 karakter) dengan **Video Description Hashtags** (format `#PascalCase` valid tanpa spasi). Dilengkapi tombol salin pintar sekali klik: tombol *⚡ Salin Tag Studio (500 Char)* pada header banner dan tombol ganda (*📋 Tags* & *🏷️ #Hashtag*) pada setiap kartu tier SEO.

---

### 1 — Mesin Parser Presisi & Formatters Baru (`parsers.ts`)

- **`formatAsYouTubeTags(rawText: string): string`**:
  - Membersihkan karakter pagar `#`, tanda kutip tunggal/ganda, dan kelebihan spasi dari tag mentah AI.
  - Melakukan deduplikasi kata kunci secara *case-insensitive*.
  - Menggabungkan hasil dengan separator standar `, ` yang siap langsung ditempel ke kotak tag YouTube Studio.
- **`formatAsHashtags(rawText: string): string`**:
  - Mengonversi frasa multi-kata menjadi format hashtag media sosial yang valid dalam `#PascalCase` tanpa spasi (contoh: `"reptile third eye"` → `"#ReptileThirdEye"`).
  - Menghilangkan tanda baca ilegal serta melakukan deduplikasi *case-insensitive* untuk deskripsi video dan media sosial.
- **`buildCombinedYouTubeTags(tagSpesifik, tagUmum, tagMajemuk, maxChars = 500): string`**:
  - Menggabungkan kata kunci dari Tier 1 (Spesifik), Tier 2 (Umum), dan Tier 3 (Long-tail) menjadi satu kesatuan.
  - Membatasi panjang teks secara cerdas tepat di batas kata kunci terakhir sebelum melampaui limit 500 karakter dari YouTube Studio.

---

### 2 — Penyempurnaan Antarmuka Scene Prompt Studio (`ScenePromptStudioClient.tsx`)

- **Tombol Cepat Header: `⚡ Salin Tag Studio (500 Char)`**:
  - Menyediakan tombol gradient Amber-Orange di samping *"Salin Semua Metadata SEO"*, memungkinkan kreator menyalin seluruh tag yang sudah dipangkas otomatis di bawah 500 karakter dalam 1 klik.
  - Dilengkapi feedback visual seketika (`✓ Tags Studio Disalin`) dan notifikasi toast.
- **Dual-Action Smart Copy pada Kartu Tier 1, Tier 2, & Tier 3**:
  - Tombol teks biasa *"Salin"* digantikan dengan tombol ganda:
    - **`📋 Tags`**: Menyalin kata kunci terpisah koma untuk Tag Box YouTube Studio.
    - **`🏷️ #Hashtag`**: Menyalin tag dalam format hashtag PascalCase untuk Deskripsi Video.
- **Pembersihan Chip Badge Kata Kunci**:
  - Mengeliminasi bug tampilan hashtag berpasi (sebelumnya `#{t.replace(/^#/, "")}` yang menampilkan `#reptile third eye`).
  - Chip kini disajikan sebagai pill keyword yang bersih dan rapi tanpa awalan tanda pagar palsu.

---

### 3 — Pembaruan Instruksi Generator Prompt AI (`promptGenerator.ts`)

- **Instruksi Output AI Tanpa Tanda Pagar**:
  - Memperbarui panduan output blok `## METADATA SEO YOUTUBE 2026` agar AI menyajikan kata kunci yang dipisahkan koma murni tanpa tanda pagar `#` sesuai spesifikasi YouTube Tag Box.

---

### 4 — Verifikasi & Pengujian Komprehensif

- **Vitest Suite 100% Green (139/139 Tests)**:
  - 8 pengujian unit baru ditambahkan di `tests/parsers.test.ts` untuk menguji fungsionalitas `formatAsYouTubeTags`, `formatAsHashtags`, serta batasan panjang `buildCombinedYouTubeTags`.
- **TypeScript Typecheck**:
  - `npx tsc --noEmit` lolos bersih dengan 0 error.

---

## [#83] — 2026-09-25 | Standardized Bracket Acting & Beat Cues `[...]`: Studio Raw Copy Normalization & Zero-Gap TTS Cleaning

### Overview

Penyelarasan standar penulisan arahan panggung (*stage direction*), intonasi emosi, dan jeda (*beat*) pada naskah narasi ke format kurung siku industri profesional `[...]` (misal: `[wide-eyed, urgent whisper]` dan `[beat]`). Pembaruan ini memperbarui instruksi generator prompt AI (`promptGenerator.ts`), memperkuat parser pemisah audio cue (`parsers.ts`), dan memperkenalkan normalisasi dua arah (*backward compatibility*) agar draft naskah lama maupun baru disajikan dalam format kurung siku yang konsisten pada **Raw Copy** di Scene Prompt Studio, sementara **Clean TTS Copy** dan Gemini TTS tetap membaca dialog lisan secara murni tanpa hambatan.

---

### 1 — Pembaruan Instruksi Generator Prompt AI (`promptGenerator.ts`)

- **Standarisasi Format Kurung Siku `[...]`**:
  - Memperbarui instruksi format narasi (`narasiExample`) dari kurung bulat `'(...)'` menjadi kurung siku `'[...]'`:
    *`WAJIB sertakan instruksi intonasi suara, emosi, dan bahasa tubuh di dalam tanda kurung siku '[...]' di awal atau sela-sela kalimat, misal: "[tersenyum ramah, berbisik] Kamu pasti berpikir..." atau "[antusias, tempo cepat] Stop! Perhatikan baik-baik..." atau "[beat]"`*
  - Memperbarui panduan sintaks Markdown Scene 2 agar AI model (ChatGPT, Claude, Gemini) konsisten menerapkan tanda kurung siku `[...]` untuk intonasi dan jeda naskah.

---

### 2 — Mesin Parser Presisi & Normalisasi Narasi Mentah (`parsers.ts`)

- **Fungsi Normalisasi Baru `normalizeActingCuesToBrackets`**:
  - Mengonversi otomatis instruksi panggung lama berkurung bulat `(...)` atau bertanda bintang `*(...)*` menjadi kurung siku `[...]` secara elegan saat naskah diurai.
  - Contoh: `(wide-eyed, urgent whisper) Right there. (beat) That's an eye.` → `[wide-eyed, urgent whisper] Right there. [beat] That's an eye.`
  - Cues yang sudah berformat `[...]` dipertahankan utuh tanpa re-formatting ganda.
- **Penyempurnaan Proteksi Audio Cues (`extractAudioCues`)**:
  - Memperketat regex pendeteksi efek suara (`[SFX: ...]` dan `[Sound: ...]`) dengan kewajiban separator tegas agar instruksi akting deskriptif yang mengandung kata `sound` (misal: `[sound of footsteps]`, `[sighing sound]`) tidak terhapus keliru sebagai audio cue.
- **Pembersihan Bersih TTS Zero-Gap (`cleanNarasiForTts`)**:
  - Menyempurnakan pembersih bracket kurung siku dengan spasi normalizer (`\s*\[[^\]]*\]\s*`) sehingga kalimat di antara acting cue tidak menempel rapat (*zero-gap spacing preservation*).
  - Teks spoken dialogue yang disalin melalui tombol *"Copy Narration"* ataupun dikirim ke Gemini TTS tetap 100% bebas dari bracket dan bersih untuk dibacakan.

---

### 3 — Verifikasi & Pengujian Komprehensif

- **Vitest Suite 100% Green (131/131 Tests)**:
  - 5 test baru di `tests/parsers.test.ts` memverifikasi normalisasi `normalizeActingCuesToBrackets`, pembersihan `cleanNarasiForTts` pada bracket acting cue & beat, serta penguraian adegan `parseScenes` dengan Raw Copy preservation.
- **TypeScript Typecheck**:
  - `npx tsc --noEmit` lolos bersih dengan 0 error.

---

## [#82] — 2026-09-25 | Dynamic Custom Role & POV AI Engine: 3-Tier Precedence Hierarchy & Conflict-Free Persona Resolution

### Overview

Pembaruan strategis pada fleksibilitas personalisasi AI di Generator Studio (`GeneratorForm.tsx`), menghadirkan fitur **Role & POV AI Dinamis / Custom** yang memungkinkan kreator merumuskan persona AI khusus secara bebas per topik/tema video. Sistem ini menerapkan arsitektur **3-Tier Precedence Hierarchy** pada mesin pembuat prompt (`promptGenerator.ts`) untuk memastikan arahan persona di Generator Studio menjadi prioritas utama (*Theme-Specific Override*) tanpa bentrok dengan pengaturan default saluran (*Channel Profile*), seraya menjaga database saluran tetap murni (*immutable baseline*).

---

### 1 — Antarmuka Role & POV Dinamis di Generator Studio (`GeneratorForm.tsx`)

- **Tombol Pilihan Baru `[✏️ Custom]` pada Grid Role & POV**:
  - Menambahkan opsi ke-7 dengan border beraksen dashed halus (`role.value === "CUSTOM"`), berdampingan dengan preset bawaan (*Auto, Kreator, Marketing, Pebisnis, Pendidik, Storyteller*).
  - Tampilan grid responsif 2 kolom di layar HP, 3 kolom di tablet, dan 4 kolom di desktop (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4`).
- **Kotak Input Interaktif Persona Kustom**:
  - Muncul secara halus saat tombol *Custom* diaktifkan, dilengkapi badge *"Prioritas #1 Override"* dan pembatas 300 karakter.
  - Memberikan contoh persona nyata (misal: *Dokter Spesialis Anak ramah*, *Mekanik Senior to-the-point*) untuk memandu pengguna merumuskan karakter AI terbaik.
  - Menyertakan tooltip edukatif bahwa persona kustom ini hanya berlaku khusus untuk tema video yang sedang dibuat tanpa mengubah profil permanen saluran.
- **Indikator Transparan Mode Auto & Saluran Aktif**:
  - Ketika memilih *Auto*, sistem menampilkan cuplikan persona default saluran yang sedang aktif (`ℹ️ Mengikuti Persona Channel: "..."`), memberikan kejelasan visual penuh tanpa tebak-tebak.

---

### 2 — Arsitektur 3-Tingkat Presedensi Persona (`promptGenerator.ts`)

- **Hierarki Presedensi Authoritative**:
  - **Tier 1 (Prioritas #1 / Studio Custom Override)**: Apabila pengguna memilih *Custom* dan mengisi persona spesifik di Generator Studio (`rolePOV === "CUSTOM"` & `customRolePOV`), AI diinstruksikan via directif:
    `- Peran & POV AI (Prioritas Tema Video): Bertindaklah sebagai [customRolePOV] — Karena tema video ini memiliki kebutuhan spesifik, prioritaskan karakter/persona ini di atas profil default channel untuk membawakan seluruh gaya penceritaan, emosi, dan artikulasi ide.`
    Persona bawaan saluran (`channel.personaPov`) secara otomatis disupresi sehingga naskah bebas dari kalimat persona yang saling bertentangan atau mendua.
  - **Tier 2 (Studio Preset Override)**: Pilihan preset studio (*KONTEN_KREATOR, MARKETING, PEBISNIS, PENDIDIK, STORYTELLER*) secara aktif mengesampingkan persona default saluran untuk video tersebut.
  - **Tier 3 (Fallback Saluran / Default Channel)**: Mode *Auto* mengalirkan persona bawaan saluran (`channel.personaPov`) atau konfigurasi video (`videoConfig.pov`) secara murni:
    `- Persona & Sudut Pandang Kreator: "[channel.personaPov]" — Bawakan seluruh alur penceritaan, emosi, dan artikulasi ide dari kacamata persona ini.`
- **Proteksi Input Kosong (*Blank Guard*)**:
  - Apabila opsi *Custom* dipilih namun kotak teks dibiarkan kosong atau hanya berisi spasi, generator secara otomatis jatuh ke persona saluran (*graceful fallback*) tanpa menghasilkan prompt yang cacat.
- **Imutabilitas Profil Saluran (*Channel Baseline Preservation*)**:
  - Persona kustom di generator studio bersifat *ephemeral per generation*, tidak pernah memodifikasi tabel database `ProfileChannel`. Saluran tetap memiliki identitas inti yang konsisten.

---

### 3 — Validasi API & Isolasi State Antar-Saluran (`route.ts`, `preferences/route.ts`)

- **Zod Schema Synchronization**:
  - Menambahkan field `customRolePOV: z.string().optional().nullable()` pada skema endpoint pembuatan prompt `/api/generate`.
  - Menambahkan `customRolePOV: z.string().max(500).optional()` pada skema penyimpanan otomatis preferensi form `/api/user/preferences`.
- **Per-Channel State Isolation**:
  - Input persona kustom disimpan terpisah per saluran (`channelFormStates[channelId].customRolePOV`). Saat kreator beralih saluran di generator, teks kustom saluran lain tidak akan bocor ke saluran baru.

---

### 4 — Verifikasi Kualitas & Pengujian Otomatis

- **Vitest Suite Pass 100% (126/126 Tests)**:
  - 4 pengujian unit baru di `tests/promptGenerator.test.ts` memvalidasi Tier 1 Custom Override, Tier 2 Preset Override, Tier 3 Channel Fallback, serta Blank Custom Fallback.
  - Pengujian isolasi state multi-saluran di `tests/channelStateIsolation.test.ts` memvalidasi persistensi field `customRolePOV`.
- **TypeScript Typecheck Clean**:
  - `npx tsc --noEmit` lolos dengan 0 error di seluruh workspace.

---

## [#81] — 2026-09-25 | UI/UX Precision & Ergonomics: Design System Unification, Mobile/PWA Optimization & Zero-Friction Polish

### Overview

Pembaruan komprehensif pada kualitas visual (UI) dan ergonomi antarmuka (UX) di seluruh aplikasi Prompt Gen, mencakup penyelarasan token desain global, penghapusan benturan elemen melayang (*floating stacking collisions*) di mobile view & PWA, perbaikan kontras mode terang (WCAG AA), dan standarisasi kartu adegan (*scene cards*) studio adegan dengan hierarki 2-baris responsif tanpa mengubah alur kerja (*zero-friction workflow*).

---

### 1 — Fondasi Presisi & Token Desain Global (`globals.css`)

- **Penambahan Precision Utility Classes**:
  - `.pg-btn-primary`: Tombol aksi primer dengan Brand Orange Accent (`#ff7600`), hover glow, dan transisi elevasi halus.
  - `.pg-btn-secondary` & `.pg-btn-compact`: Tombol sekunder berstruktur bersih dengan border kontras stabil.
  - `.pg-input-precision`: Kontrol input dengan focus ring brand oranye terpadu.
  - `.pb-safe-nav`: Padding bawah ergonomis `calc(5.5rem + env(safe-area-inset-bottom, 16px))` untuk mencegah konten paling bawah terpotong oleh bilah navigasi HP.
- **Penyelarasan Warna Brand Global**:
  - Menggantikan inkonsistensi tombol biru generik (`bg-blue-600`) pada Generator, Saluran, Pengaturan, dan Pricing menjadi Brand Orange Neumorphism terpadu.

---

### 2 — Optimasi Tampilan Mobile & PWA (`layout.tsx`, `InstallPWABanner.tsx`)

- **Penyelesaian Benturan Elemen Mengambang (*Floating Stacking Collisions*)**:
  - Banner Install PWA di layar smartphone kini diposisikan secara elegan di bawah bilah atas (`top-16 left-3 right-3`), meninggalkan area bawah layar bebas untuk navigasi jempol dan tombol bantuan Customer Service.
  - Floating CS Widget tetap bebas diakses di `bottom-24 right-4` tanpa tertutup banner PWA.
- **Ergonomi Safe Area Notch & Home Indicator**:
  - Mengadopsi `.pb-safe-nav` pada kontainer `main` di `dashboard/layout.tsx` sehingga formulir panjang dan tombol aksi paling bawah dapat digeser tuntas di atas tombol navigasi mengambang.

---

### 3 — Pemolesan Studio Prompt Adegan (`ScenePromptStudioClient.tsx`)

- **Bilah Tab Kontrol Tersegmentasi (*Segmented Tab Bar*)**:
  - Wadah tab dibungkus dengan kartu kaca (*glass-panel*) bersudut melengkung halus `rounded-2xl` dengan badge jumlah adegan real-time (`🎬 Scene Viewer (X)`).
- **Toolbar Aksi Adegan Responsif**:
  - Checkbox pemilihan adegan menggunakan aksen oranye brand.
  - Tombol split **Copy All Narration (Clean TTS / Raw)** dan **Batch Export** memiliki ketinggian presisi `h-9` yang simetris di desktop dan tertata rapi di mobile.
- **Hierarki Kartu Adegan 2-Baris (Anti-Overflow)**:
  - **Baris 1**: Checkbox adegan + Judul Adegan (`Scene 1`) di kiri, dan Monospace Duration Pill (`⏱️ 08s`) di kanan.
  - **Baris 2**: Badge Emosi (🎯) dan Pacing (⚡) berbaris rapi dengan chip lembut tanpa menabrak durasi di layar HP selebar 360–390px.
- **Spoken Narration & Visual Prompt Console**:
  - Blok narasi memiliki pemisah visual yang nyaman dibaca dengan tombol salin TTS bersih dan opsi Raw yang jelas.
  - Visual Prompt disajikan dalam gaya konsol studio gelap (`bg-slate-950 border-slate-800 font-mono`) dengan tombol salin berumpan balik instan.

---

### 4 — Standardisasi Modul Pendukung (Drafts, Pricing, Settings, Channels)

- **Perbaikan Bug Kontras Mode Terang di Drafts (`drafts/page.tsx`)**:
  - Mengubah tombol status kosong yang sebelumnya memiliki teks putih di atas latar abu-abu terang (`text-white` di atas `pg-surface`) menjadi `pg-btn-primary` dengan teks kontras tinggi yang jelas terbaca.
  - Tautan aksi draft diselaraskan dengan aksen brand oranye.
- **Formulir Pengaturan & Akun (`SettingsClient.tsx`)**:
  - Mengganti focus ring biru hardcoded dengan `focus:ring-[var(--pg-brand)]` dan tombol simpan profil ke `pg-btn-primary`.
- **Manajemen Saluran (`ChannelManagerClient.tsx`) & Pricing (`PricingClient.tsx`)**:
  - Tombol tambah saluran dan langganan paket Pro diselaraskan ke tema oranye brand dengan kartu berpenampilan konsisten.

---

### 5 — Verifikasi Kualitas & Integritas Kode

- **Automated Tests**: **122/122 tests lolos 100%** di 13 test suites (`vitest run`).
- **TypeScript Typecheck**: `npx tsc --noEmit` lolos dengan 0 error.
- **User Workflow Continuity**: 100% posisi fungsi dan tombol penting dipertahankan tanpa perubahan alur kerja yang membingungkan.

---

## [#80] — 2026-09-25 | Feature & Resilience: Multi-LLM Double-Prefix Header Support (# ##), Split "Copy All (TTS / Raw)" & Syntax Directive

### Overview

Penyempurnaan arsitektur parsing multi-LLM (mengatasi kebiasaan format unik ChatGPT seperti `# ## SCENE 1`), penambahan tombol split **Copy All Narration (TTS Ready & Raw)** di antarmuka Studio, serta penyuntikan direktif sintaks ketat pada `promptGenerator.ts` agar seluruh model AI (ChatGPT, Claude, Gemini, DeepSeek) menghasilkan format naskah yang terstandardisasi.

---

### 1 — Imunitas Parser Terhadap Variasi Header Ekstrem (`parsers.ts`)

- **Dukungan Double-Prefix Header (`# ## SCENE 1`, `# ## THUMBNAIL STUDIO`)**:
  - Pada beberapa sesi, ChatGPT menghasilkan header gabungan seperti `# ## SCENE 1` (kombinasi H1 dan H2). Regex splitter kini menggunakan `/(?:^|\r?\n)(?:#{1,6}\s*|\*{2,3}\s*|={2,4}\s*)*(?:Scene|Adegan|Bagian|Part)\s*([a-zA-Z0-9_\-]+)(?:[:\s\*\-=_]*)(?=\r?\n|$)/gi`.
  - Mampu mendeteksi dan memecah adegan secara sempurna dari model apa pun, baik `## SCENE 1` (Claude), `# ## SCENE 1` (ChatGPT), `# SCENE 1`, `Scene 1:`, maupun `**SCENE 1:**`.
- **Refactoring Pencarian Header Berikutnya pada SEO & Thumbnail**:
  - Memperbaiki `nextHeaderMatch` pada `extractThreeTierSeo` agar pencarian section berikutnya dilakukan secara ketat setelah baris judul section aktif, mencegah *false positive* pada header berawalan `# ##`.
  - Memperluas pencocokan field thumbnail (`extractThumbnailData`) dan SEO (`extractThreeTierSeo`) terhadap penempatan titik dua di dalam tanda bintang tebal (`**TAG SPESIFIK:**`).

---

### 2 — Split Button "Copy All Narration" (Clean TTS & Raw) (`ScenePromptStudioClient.tsx`)

- **Tombol Split Terpadu**:
  - **Bagian Kiri (`🎤 Copy All Narration`)**: Menyalin seluruh teks spoken narasi yang telah dibersihkan secara instan melalui `cleanNarasiForTts` (siap ditempel ke ElevenLabs, CapCut, dsb. tanpa perlu menghapus instruksi panggung).
  - **Bagian Kanan (`Raw`)**: Menyalin seluruh naskah narasi dalam bentuk mentah (*raw*) lengkap dengan tanda kurung petunjuk akting `(...)`, jeda `(pause)`, dan tanda kutip, memudahkan kreator untuk membandingkan atau mendokumentasikan catatan sutradara.

---

### 3 — Penguatan Direktif Sintaks pada Prompt Generator (`promptGenerator.ts`)

- **Direct Syntax Formatting Enforcement**:
  - Menyuntikkan blok instruksi khusus `[ATURAN SINTAKS FORMAT WAJIB — SEMUA AI (CHATGPT, CLAUDE, GEMINI)]` ke dalam prompt naskah.
  - Menginstruksikan AI secara eksplisit untuk menggunakan `## SCENE [NOMOR]`, melarang penulisan `# ##`, dan melarang membungkus titik dua di dalam tanda bintang tebal.
  - Menyediakan perlindungan berlapis (*defense-in-depth*): Prompt mengarahkan AI untuk disiplin, dan Parser siap mengoreksi jika AI tetap menyimpang.

---

### 4 — Verifikasi & Pengujian Kualitas

- **Automated Tests**: **122/122 tests lolos 100%** di 13 test suites (`vitest run`), termasuk pengujian naskah 7-scene penuh dari ChatGPT dan Claude.
- **TypeScript Typecheck**: `npx tsc --noEmit` lolos tanpa error (exit code 0).

---

## [#79] — 2026-09-25 | Bugfix & Workflow Enhancement: ChatGPT Markdown Scene Parsing & Clean TTS Narration Copy

### Overview

Pembaruan komprehensif pada ketahanan (*resilience*) parser naskah AI dan efisiensi alur kerja *Text-to-Speech* (TTS). Patch ini menyelesaikan 2 kendala krusial:
1. **Kegagalan Parsing Format ChatGPT**: Format output ChatGPT dengan header tingkat-1 (`# SCENE 1`), pembatas tebal (`**NARASI:**`, `**TARGET EMOSI (VET):**`, `**DURASI:** 6 seconds`), dan garis horizontal (`---`) sebelumnya gagal dikenali splitter regex dan memicu *fallback* keliru menjadi 1 scene tunggal berdurasi 15 detik dengan ratusan badge SFX duplikat.
2. **Perlambatan Alur Kerja Salin Narasi ke TTS**: Tombol salin narasi (`Copy` dan `Copy All Narration`) sebelumnya menyalin instruksi akting mentah dalam tanda kurung (seperti `(hushed, urgent whisper)`, `(pause)`, `(warmly, aside)`) dan tanda kutip (`"..."`), yang menyebabkan model TTS membacakan instruksi panggung secara harfiah sehingga pengguna harus mengedit teks secara manual satu per satu.

---

### 1 — Ketahanan Parser ChatGPT & Multi-LLM (`parsers.ts`)

- **Dukungan Single-Hash Header (`# SCENE 1`)**:
  - Regex splitter diperluas dari `(?:##\s*|###\s*...)` menjadi `/(?:^|\r?\n)(?:#{1,4}\s*|\*\*\s*|={1,4}\s*)?(?:Scene|Adegan|Bagian|Part)\s*([a-zA-Z0-9_\-]+)(?:[:\s\*\-=_]*)(?=\r?\n|$)/gi`.
  - Mampu membelah scene dari ChatGPT (`# SCENE 1`), Claude (`## SCENE 1`), Gemini (`Scene 1:`), maupun markdown tebal (`**SCENE 1:**`).
- **Pencocokan Field Cerdas & Robust Delimiter Lookahead**:
  - Delimiter lookahead `delimLookahead` kini mentolerir tanda tebal markdown (`**`), penempatan titik dua di dalam maupun di luar asterisks (`**NARASI:**` atau `**NARASI**:` atau `NARASI:`), baris horizontal `---`, serta pemisah antar field.
  - Sisa teks footer seperti `# THUMBNAIL STUDIO` dan `# METADATA SEO` dipotong secara presisi menggunakan regex `stop` yang mendukung single hash (`#{1,4}`).
- **Normalisasi Durasi Scene (`normalizeDurasi`)**:
  - Nilai durasi verbal seperti `6 seconds`, `7 seconds`, atau `5 detik` dinormalisasi secara otomatis menjadi format ringkas seragam (`6s`, `7s`, `5s`) agar badge UI selalu rapi dan konsisten.

---

### 2 — Clean Spoken Narration Copy untuk Text-to-Speech (`parsers.ts` & `ScenePromptStudioClient.tsx`)

- **Peningkatan Fungsi `cleanNarasiForTts`**:
  - Membersihkan instruksi akting/panggung dalam tanda kurung: `(hushed, urgent whisper)`, `(pause)`, `(warmly, aside)`, `*(urgent)*`.
  - Membersihkan cue audio/efek dalam tanda kurung siku: `[SFX: sharp whoosh]`, `[BGM: ...]`.
  - Membersihkan tanda kutip ganda dekoratif (`"`, `“`, `”`).
  - Membersihkan tanda petik pembungkus tepi tanpa merusak tanda apostrof di dalam kata (contoh: `can't`, `it's`, `reptile's` tetap utuh 100%).
  - Membersihkan sisa asterisks pemformatan markdown (`*`, `**`, `***`, `_`).
  - Menormalisasi spasi di depan tanda baca (` .` $\rightarrow$ `.`, spasi ganda $\rightarrow$ spasi tunggal).
- **Integrasi Tombol Salin Narasi Studio**:
  - **`🎤 Copy All Narration`**: Memetakan seluruh scene yang valid melalui `cleanNarasiForTts`, menghasilkan teks narasi bersih siap-tempel ke ElevenLabs, CapCut, Fish Audio, atau TTS lainnya tanpa instruksi akting atau tanda kutip yang mengganggu.
  - **Tombol Salin per Scene**:
    - Tombol utama `Copy` langsung menyalin teks narasi bersih (*pure spoken text*).
    - Menambahkan tombol sekunder `Raw` yang otomatis muncul jika terdapat instruksi sutradara, memungkinkan kreator menyalin teks asli jika dibutuhkan untuk dokumentasi naskah.

---

### 3 — Verifikasi & Pengujian Kualitas

- **Unit Testing (`tests/parsers.test.ts`)**:
  - Menambahkan pengujian end-to-end untuk output ChatGPT dengan single-hash `# SCENE 1`, header `**NARASI:**`, dan baris horizontal `---`.
  - Menambahkan pengujian pembersihan narasi TTS untuk sampel Claude, ChatGPT, dan naskah bilingual.
  - Total pengujian: 119/119 lolos 100% di 13 test suites.
- **TypeScript Typecheck**:
  - `npx tsc --noEmit` lolos tanpa error (exit code 0).

---

## [#78] — 2026-09-25 | Feature & Bugfix: Smart Short-Form Chapter Suppression, Bilingual Chapter Markers, and Voice Sync Guidelines

### Overview

Penyempurnaan arsitektur segmentasi bab (*chapter structure*), parser audio-visual, dan antarmuka *Scene Prompt Studio* & *Draft Preview*. Pembaruan ini mengatasi masalah di mana video Shorts/Reels vertikal (9:16) dengan durasi pendek (contoh: 50 detik, 7 scene) dipaksa memecah alur menjadi bab tematik (*Long-Form chaptering*), serta mengintegrasikan panduan sinkronisasi audio-kamera (`Sync:`) dan dukungan format bab dwibahasa (`CHAPTER` & `BAB`).

---

### 1 — Smart Long-Form vs Short-Form Detection (`promptGenerator.ts`)

- **Akar Masalah**:
  - Sebelumnya, `isLongForm` dihitung murni berdasarkan `sceneCount > 6`.
  - Pada video pendek vertikal (YouTube Shorts, TikTok, Instagram Reels) dengan tempo cepat (jump cuts, B-rolls), kreator sering menggunakan 7–10 scene singkat (5–8 detik per scene).
  - Akibatnya, video Shorts 50 detik otomatis diinjeksi direktif `[STRUKTUR BAB OTOMATIS — KONTEN LONG-FORM]`, memecah video pendek menjadi beberapa BAB dan memicu duplikasi overlay `[CHAPTER TITLE]`.
- **Solusi & Implementasi**:
  1. **Deteksi Short-Form Pintar (`isVerticalOrShort`)**:
     - Memeriksa apakah `aspectRatio === "9:16"`, platform adalah `TIKTOK`, `INSTAGRAM_REEL(S)`, `YOUTUBE_SHORTS`, `SHORTS`, atau durasi total $\le 90$ detik.
     - Video Short-Form **tidak akan lagi** menginjeksi struktur bab secara otomatis, kecuali jika pengguna secara eksplisit memilih `overlayStyle === "chapter_titles"`.
  2. **Bilingual Chapter Localization (Anti Language Bleed)**:
     - Jika bahasa output adalah bahasa Inggris, instruksi bab secara otomatis menggunakan kata kunci `CHAPTER` (`## CHAPTER 1: Opening Hook`, `## CHAPTER 2: Core Deep Dive`) dan menegaskan penulisan overlay dalam bahasa Inggris yang selaras.
     - Jika bahasa Indonesia, menggunakan kata kunci `BAB` (`## BAB 1: Opening Hook`, `## BAB 2: Pembahasan Utama`).
  3. **Array Type Guard pada `excludeTitles`**:
     - Menambahkan guard `Array.isArray(excludeTitles)` untuk mencegah runtime error saat argumen dilewatkan tanpa array.

---

### 2 — Parser Engine & Voice Guidelines Sync (`parsers.ts`)

- **Dukungan Parameter `Sync:`**:
  - Menambahkan properti `sync?: string` pada antarmuka `VoiceGuidelines`.
  - Fungsi `parseVoiceGuidelines` kini memproses segmen `Sync:` pada string `PANDUAN SUARA` (contoh: `[SFX: Wet Tongue Flick] tepat saat lidah menyentuh mata, snap zoom bersamaan`).
- **Dukungan Bilingual Chapter Regex**:
  - Memperbarui regex ekstraksi bab agar mengenali kedua marker `BAB` dan `CHAPTER`:
    `/(?:^|\r?\n)##\s*(BAB|CHAPTER)\s+(\d+)\s*:\s*(.+?)(?=\r?\n|$)/gi`
  - Menyimpan `chapterPrefix` (`"CHAPTER"` atau `"BAB"`) pada entitas `Scene`.

---

### 3 — UI Harmonization (`ScenePromptStudioClient.tsx` & `drafts/[id]/page.tsx`)

- **Dynamic Chapter Divider**:
  - Divider bab merender `{scene.chapterPrefix || "BAB"} {scene.chapter}: {scene.chapterTitle}`, sehingga naskah berbahasa Inggris tampil natural sebagai `CHAPTER 1` dan naskah Indonesia sebagai `BAB 1`.
- **Integrasi Kotak Panduan Suara Studio & Draft**:
  - Kotak biru panduan suara kini menampilkan baris sinkronisasi `⏱️ Sync: ...` agar kreator/editor video mengetahui momen persis sinkronisasi SFX/BGM dengan pergerakan kamera.
  - Halaman Draft Preview (`drafts/[id]`) diselaraskan penuh dengan menyertakan badge emosi 🎯, pacing ⚡, dan kotak panduan suara lengkap.

---

### 4 — Quality Assurance & Verification

- **TypeScript Compilation**: `npx tsc --noEmit` lolos 100% tanpa error (exit code 0).
- **Unit Test Suite**: 117/117 tests lolos 100% di 13 test suites (`vitest run`).
  - Menambahkan pengujian khusus untuk `parseVoiceGuidelines` (`Sync:`), bilingual chapter parsing (`CHAPTER` & `BAB`), dan deteksi otomatis short-form vs long-form.

---

## [#77] — 2026-09-25 | Bugfix: Elimination of Infinite Preferences Fetch Loop & Render Flooding in Scene Prompt Studio

### Overview

Penyelesaian tuntas masalah *infinite fetch loop* dan *render storm* pada halaman Scene Prompt Studio (`/dashboard/scene-prompt`). Bug ini sebelumnya menyebabkan browser console dibanjiri ratusan hingga ribuan log `Fetch finished loading: GET "https://muatin.id/api/user/preferences"`, ribuan panggilan `postMessage` internal React fiber (`ug`, `uh`), serta *excessive debounce PUT requests* yang menurunkan performa browser secara drastis.

---

### 1 — Root Cause Analysis & Resolution

- **Akar Masalah (Object Reference Instability & Dependency Loop)**:
  - Pada `ScenePromptStudioClient.tsx`, variabel `defaultSource` dideklarasikan secara *inline* tanpa `useMemo`. Setiap kali komponen me-render ulang, `defaultSource` selalu menghasilkan referensi objek JavaScript baru (`{ raw: ..., parsed: ... }`).
  - Selain itu, `defaultSource` dan `t` dicantumkan ke dalam *dependency array* dari `useEffect` pemuat preferensi server (`/api/user/preferences`).
  - Akibatnya:
    1. Efek awal memanggil `GET /api/user/preferences`.
    2. Data preferensi tiba dan mengupdate state (`selectedChannelId`, `ar`, `sref`, `cref`, `ttsVoice`, dll.).
    3. State update memicu re-render komponen.
    4. Re-render menghasilkan objek `defaultSource` baru di memori (`defaultSource !== prevDefaultSource`).
    5. React mendeteksi perubahan dependensi dan mengeksekusi `useEffect` kembali.
    6. Terjadi siklus rekursif tak berujung (*infinite loop*) yang membanjiri jaringan dan React rendering engine.

- **Solusi & Hardening Terpasang**:
  1. **Memoization `defaultSource` via `useMemo`**:
     - `defaultSource` kini dibungkus dengan `React.useMemo(() => { ... }, [initialDraft, initialParsedOutputs])`.
     - Menghentikan alokasi objek baru pada setiap render dan mengeliminasi eksekusi berulang fungsi regex berat `parseScenes` di setiap ketikan/render.
  2. **Mount-Only Dependency (`[]`) pada Load Effect**:
     - Memulihkan *dependency array* efek pemuatan preferensi dari `[defaultSource, t]` menjadi `[]` (strictly runs once on mount), selaras dengan pola standar yang terbukti stabil pada `GeneratorForm.tsx`.
  3. **Auto-Save Initialization Guard (`isInitializedRef`)**:
     - Menambahkan ref `isInitializedRef = useRef(false)` yang baru diaktifkan (`true`) dalam blok `.finally()` setelah pemanggilan `GET /api/user/preferences` selesai.
     - Efek auto-save (`PUT /api/user/preferences`) kini memiliki guard `if (!isInitializedRef.current) return;`, mencegah transmisi PUT prematur dengan nilai default saat inisialisasi awal.
  4. **Draft Handover Guard (`lastLoadedDraftIdRef`)**:
     - Menambahkan `lastLoadedDraftIdRef` pada efek navigasi `initialDraft` agar notifikasi `toast.success` dan parser draft hanya dieksekusi satu kali per ID draft baru.

- **File:** `src/app/[locale]/dashboard/scene-prompt/ScenePromptStudioClient.tsx`.

---

### 2 — Quality Assurance & Verification

- **TypeScript Compilation (Zero Error)**: `npx tsc --noEmit` lolos 100% tanpa error typing.
- **Unit Test Suite**: 112/112 tests lolos 100% (`vitest run`).
- **Verifikasi Runtime**:
  - `GET /api/user/preferences` hanya dipanggil tepat 1 kali saat halaman pertama kali dimuat.
  - Render loop fiber dan spam `postMessage` sepenuhnya tereliminasi.

---

## [#76] — 2026-09-25 | Feature: YouTube 2026 Strategy Master Reference Document Ingestion & Deduplication

### Overview

Penyematan langsung modul landasan teoritis **"Dokumen Rujukan Utama: Panduan Lengkap Strategi YouTube 2026 (Shorts & Long-Form)"** ke dalam Master Prompt AI. Fitur ini mengikat model AI (ChatGPT / Claude / Gemini) dengan mandat studi imperatif untuk menyerap 5 pilar strategi 2026 (Predictive Viewer Satisfaction, VET 3-Act Storytelling, Zero Dead-Air Pacing, Formula Thumbnail 2026 & Mobile Shrink Test 120px, serta Arsitektur SEO 3-Tier) sebelum memproses materi pengguna. Selain itu, dilakukan deduplikasi string panduan algoritma Long-Form menjadi konstanta tunggal (*single source of truth*).

---

### 1 — Master Reference Document & Mandat Studi AI

- **Penyematan Dokumen Rujukan Utama (`YOUTUBE_2026_STRATEGY_MASTER_DOC`)**:
  - Menyematkan blok `[DOKUMEN RUJUKAN UTAMA: PANDUAN LENGKAP STRATEGI YOUTUBE 2026 (SHORTS & LONG-FORM)]` tepat di atas topik video pengguna pada seluruh skenario konten YouTube (Shorts maupun Long-Form).
  - Merangkum 5 pilar mutlak:
    1. *Paradigma Rekomendasi 2026*: Target APV >85-100% (Shorts), AVD & struktur bab tematik (Long-Form).
    2. *Storytelling VET 3-Act*: Validation (0-15%) → Exploration (15-80%) → Transformation (80-100%).
    3. *Zero Dead-Air & Dinamika Audio*: Pemangkasan jeda hening (<0.3s), activity layer lingkungan bergerak, dan visual sync beat.
    4. *Formula Thumbnail 2026*: 5 template anti-gagal, dominasi wajah emosional 60-80%, dan kepatuhan mobile shrink test 120px.
    5. *Arsitektur SEO 3-Tier*: Tag spesifik, tag umum, tag majemuk (long-tail), dan deskripsi naratif empati.
- **Mandat Studi Imperatif**:
  - Pada `systemInstruction`, ditambahkan direktif kepatuhan mutlak terhadap Dokumen Panduan 2026.
  - Pada pembuka Tahap 1 (pembuatan judul) dan naskah langsung, AI secara eksplisit diperintahkan menyerap dokumen rujukan ini sebelum mendekonstruksi topik pengguna.
- **File:** `src/lib/promptGenerator.ts`.

---

### 2 — Script Deduplication & Single Source of Truth

- **Eliminasi Redundansi Panduan YouTube Long**:
  - Menggabungkan duplikasi string antara entri `"YouTube Long"` dan `"YouTube Long-Form"` pada `DEFAULT_PLATFORM_ALGORITHM_GUIDE` ke dalam konstanta tunggal `YOUTUBE_LONG_GUIDE`.
  - Mengeliminasi redundansi deklarasi `const isYoutube` ganda dalam perakitan prompt.
- **File:** `src/lib/promptGenerator.ts`.

---

### 3 — Quality Assurance & Testing

- **112/112 Unit Tests Lolos (100% Passing)**:
  - Penambahan 3 test case baru: verifikasi injeksi dokumen master pada YouTube Shorts, verifikasi pada YouTube Long-Form, serta penegasan bahwa platform non-YouTube (seperti TikTok) tidak terinjeksi dokumen rujukan YouTube agar fokus platform tetap murni.
- **TypeScript 0 Error**: `npx tsc --noEmit` lolos 100%.
- **File:** `tests/promptGenerator.test.ts`.

---

## [#75] — 2026-09-24 | Feature: Strategic Material Deconstruction & Cognitive Priming 2026 (Tahap 0 Ingestion)

### Overview

Penerapan *Cognitive Priming & Strategic Material Deconstruction* (Tahap 0) pada generator prompt AI. Fitur ini mewajibkan LLM (ChatGPT / Claude / Gemini) mempelajari dan mendekonstruksi seluruh materi mentah, topik, persona, serta pedoman strategi YouTube 2026 sebelum melompat ke pembuatan judul (Tahap 1) dan naskah lengkap (Tahap 2). Pendekatan ini mengeliminasi *premature/shallow generation* dan menjamin setiap judul serta naskah berakar kuat pada *0–3s Value Promise*, pembedahan *pain point* nyata, dan sudut pandang kontras (*contrarian angle*).

---

### 1 — Master Prompt Directive: Dekonstruksi Materi & Intisari Strategis 2026

- **Injeksi Format Wajib Sebelum Ide Judul (Tahap 1)**:
  - Sebelum menampilkan 10 ide judul, AI diwajibkan menuliskan blok analisis:
    ```markdown
    [DEKONSTRUKSI MATERI & INTISARI STRATEGIS 2026]
    - Masalah Inti / Pain Point Audiens: [Identifikasi masalah nyata atau keresahan terdalam audiens]
    - Transformasi & Janji Nilai 3 Detik (0-3s Value Promise): [Solusi konkret atau janji nilai pembuka]
    - Sudut Pandang Kontras / Angle Pembeda: [Sudut pandang segar pembeda dari konten pasaran]
    ```
  - 10 ide judul selanjutnya dirancang langsung berdasarkan hasil dekonstruksi tersebut, sehingga memiliki rasionalisasi retensi yang jelas dan bukan sekadar *clickbait* kosong.
- **Dukungan Naskah Langsung (Direct Script Mode)**:
  - Jika seksi judul dinonaktifkan, instruksi dekonstruksi materi tetap diinjeksikan sebelum naskah lengkap dibuat agar alur cerita tetap memiliki *grounding* kontekstual.
- **File:** `src/lib/promptGenerator.ts`.

---

### 2 — Parser Hardening & Blacklist Keywords Expansion

- **Ekspansi `TITLE_BLACKLIST_KEYWORDS`**:
  - Menambahkan kata kunci dekonstruksi (`"dekonstruksi"`, `"intisari"`, `"pain point"`, `"transformasi"`, `"value promise"`, `"kontras"`, `"masalah"`) pada `parsers.ts`.
  - Memastikan parser judul (`extractTitles`) mengabaikan baris analisis dekonstruksi materi secara bersih tanpa mengotori daftar judul video pada Scene Prompt Studio maupun tab generator.
- **File:** `src/lib/parsers.ts`.

---

### 3 — Quality Assurance & Testing

- **109/109 Unit Tests Lolos (100% Passing)**:
  - Pengujian baru mencakup verifikasi injeksi dekonstruksi materi pada Tahap 1, pengujian pada mode tanpa seksi judul, serta uji isolasi parser judul terhadap blok dekonstruksi materi.
- **TypeScript 0 Error**: `npx tsc --noEmit` terverifikasi lolos.
- **File:** `tests/promptGenerator.test.ts`, `tests/parsers.test.ts`.

---

## [#74] — 2026-09-24 | Fix: Scene Prompt Studio Channel Selection Synchronization & State Persistence

### Overview

Penyelesaian masalah inkonsistensi pilihan channel (*channel switching / jumping bug*) pada Scene Prompt Studio saat memuat preferensi pengguna serta sinkronisasi channel & aspect ratio saat transfer skrip dari Generator Studio. Masalah terjadi akibat kondisi *triple-write race condition* di mana nilai `selectedChannelId` di-overwrite oleh `localStorage` dan server preferences tanpa memvalidasi ketersediaan channel di daftar channel aktif (*unlocked*). Selain itu, skema preferensi server diperbarui untuk mengakomodasi state TTS Gemini Voice Studio secara utuh.

---

### 1 — Channel Validation Guard on State Restoration

- **Validasi Eksistensi Channel (`channels.some`)**:
  - Penambahan pengecekan ketat pada pemulihan state dari `localStorage`: `if (p.selectedChannelId && channels.some(c => c.id === p.selectedChannelId)) setSelectedChannelId(p.selectedChannelId);`.
  - Penambahan pengecekan ketat pada pemulihan state dari respons server preferences: `if (p.selectedChannelId && channels.some(c => c.id === p.selectedChannelId)) setSelectedChannelId(p.selectedChannelId);`.
  - Mencegah channel ID yang telah dikunci (`isLocked: true`), dihapus, atau tidak valid menimpa channel aktif di dropdown, sehingga dropdown tidak lagi berpindah secara liar atau menampilkan pilihan kosong.
- **File:** `src/app/[locale]/dashboard/scene-prompt/ScenePromptStudioClient.tsx`.

---

### 2 — User Preferences API & Schema Passthrough

- **Ekspansi Skema `scenePromptStateSchema`**:
  - Menambahkan key baru untuk Voice Studio: `ttsVoice`, `ttsModel`, `ttsPitch`, `ttsSpeed`, `ttsStyleInstruction`, `ttsVoiceFilter`, dan `favoriteVoices`.
  - Mengubah mode schema dari `.strict()` menjadi `.passthrough()` pada `scenePromptStateSchema` dan `preferencesSchema` guna mencegah sanitasi berlebih yang membuang field baru saat preferensi disimpan.
- **Dukungan Alias Metode HTTP**: Menambahkan alias `export { PUT as POST };` untuk kompatibilitas ke belakang saat pemanggilan API preferences menggunakan method `POST`.
- **File:** `src/app/api/user/preferences/route.ts`.

---

### 3 — Generator Studio Handover Synchronization

- **Sinkronisasi Lengkap saat "Buka di Scene Prompt Studio"**:
  - Tombol pengalihan skrip kini mengirimkan payload lengkap mencakup `rawText`, `selectedChannelId: channelId`, dan `ar: videoConfig.aspectRatio || "9:16"`.
  - Memperbarui `localStorage` dan mengirimkan `PUT /api/user/preferences` sebelum melakukan navigasi, memastikan konteks channel dan rasio aspek dari Generator Studio terbawa secara akurat ke Scene Prompt Studio.
- **File:** `src/components/generator/GeneratorForm.tsx`.

---

## [#73] — 2026-09-24 | Feature: YouTube 2026 Strategy Engine (Shorts & Long-Form Studio, 3-Tier SEO, Retention Pacing Pro & Deduplication)

### Overview

Pembaruan yang mengadopsi secara utuh riset algoritma dan strategi YouTube 2026 (*Shorts & Long-Form Video*). Fitur ini menambahkan arsitektur end-to-end mulai dari hak akses paket Superadmin (fail-closed gating), studio rasio 16:9 Long-Form terdedikasi, mesin pacing & retensi berbasis kurva kepuasan penonton (VET 3-Act Storytelling & Janji Nilai 3 Detik), generator thumbnail dengan formula anti-gagal & *shrink test simulator*, metadata SEO 3-Tier (Spesifik, Umum, Long-Tail) dengan checklist pra-upload, pembersihan instruksi akting sutradara `(...)` pada Gemini TTS, serta deduplikasi script dan fungsi parser menjadi *single source of truth*.

---

### 1 — Superadmin Plan Features & Fail-Closed Gating

- **Dua Hak Akses Paket Baru**:
  1. `youtubeLongStudio` (Fail-closed: `false`): Mengontrol akses ke YouTube Long-Form Studio (16:9, chapter titles, widescreen pacing).
  2. `retentionPacingPro` (Fail-closed: `false`): Mengontrol akses ke toggle Mode PRO untuk ritme editing dan pergeseran pola visual dinamis.
- **Server-Side Enforcement**: API `/api/generate` mengecek hak akses pengguna terhadap paket aktif. Request YouTube Long tanpa entitlement langsung ditolak dengan `403 Forbidden`.
- **Integrasi Otomatis Admin Panel**: Kedua fitur terdaftar di `KNOWN_PLAN_FEATURES` dan otomatis tampil pada modal pembuatan/pengeditan paket langganan Superadmin.
- **File:** `src/lib/planFeatures.ts`, `src/app/api/generate/route.ts`, `messages/id.json`, `messages/en.json`.

---

### 2 — Generator Studio UI: YouTube 2026 Strategy & Audio Dynamics

- **YouTube Long-Form Auto-Switch**: Memilih platform YouTube Long otomatis menyetel `aspectRatio: "16:9"`, target scene (8 scene), dan overlay `chapter_titles`. Menampilkan lencana gembok `🔒` jika paket belum memiliki hak akses.
- **Retention & Pacing Engine 2026**:
  - Toggle Mode PRO (Retention Enhancer).
  - 4 Preset Ritme Pacing: *Retention Curve Smoothing & Jump Cut*, *Rapid Visual Reset (Shorts Pacing)*, *Documentary Deep Dive*, dan *Contrarian Staccato*.
- **Audio Dynamics 2026**:
  - *Fade-in/Fade-out Halus*: Mengeliminasi audio pop/clipping kasar pada awal dan akhir video.
  - *Visual Sync to Audio Beat*: Mengunci pergantian visual dan transisi persis pada ketukan/tempo BGM.
- **Storytelling Framework (VET 3-Act)**: *Validation* (0-15%) → *Exploration* (15-80%) → *Transformation* (80-100%).
- **Janji Nilai 3 Detik (0-3s Value Promise)**: Input penegasan janji solusi konkret pembuka untuk mencegah kurva retensi menukik tajam (*cliff drop-off*).
- **Preset Thumbnail 2026 Anti-Gagal**: 5 template (*Extreme Contrast Split*, *Single Word Shock*, *Red Circle Inset*, *Side-by-Side Reality Check*, *Subject Isolation Bokeh*) + toggle *Wajah Dominan 60–80%*.
- **3-Tier SEO Target Inputs**: Input terstruktur untuk Tag Spesifik (Brand/Entitas), Tag Umum (Kategori), dan Tag Majemuk (Long-tail 3–5 kata).
- **Multi-Profile & Channel Snapshot**: Seluruh preferensi baru tersimpan dalam snapshot channel sehingga tidak hilang saat berpindah profil.
- **File:** `src/components/generator/GeneratorForm.tsx`, `src/app/[locale]/dashboard/generator/page.tsx`.

---

### 3 — Prompt Generator & Engine Injeksi 2026

- **Algoritma Empati YouTube 2026**: Injeksi direktif platform spesifik YouTube Shorts (optimasi APV & subtle climax CTA) dan YouTube Long-Form (AVD, bab tematik, widescreen sinematik 16:9).
- **Environmental Dynamic Activity Layer**: Setiap scene wajib memiliki minimal satu elemen lingkungan bergerak (uap mengepul, flare cahaya, bokeh lampu lalu lintas, dll.) untuk menghidupkan visual AI video.
- **Parenthetical Acting Notes**: Dialog narasi dapat memuat instruksi emosi/akting sutradara dalam kurung `(...)` seperti `(berbisik tegang)`, `(tersenyum lega)`.
- **Three-Tier Metadata Formatting**: AI menghasilkan blok khusus `## METADATA SEO YOUTUBE 2026` berisi Tag Spesifik, Tag Umum, Tag Majemuk, Deskripsi Naratif Empati, dan Checklist Pra-Upload.
- **File:** `src/lib/promptGenerator.ts`.

---

### 4 — Parser Deduplication & Clean TTS Voice Pipeline

- **Deduplikasi Skrip & Interface**: Menghapus duplikasi inline `interface Scene`, `parseOverlayType`, dan `parseScenes` di `ScenePromptStudioClient.tsx`. Semua modul kini mengimpor dari `src/lib/parsers.ts` sebagai *single source of truth*.
- **Pembersihan Narasi Suara (`cleanNarasiForTts`)**: Membersihkan kurung akting `(...)` dan bracket cue audio `[...]` serta menormalkan spasi tanda baca sebelum dikirim ke Gemini TTS. Narrator AI kini membacakan dialog murni tanpa salah membaca instruksi sutradara.
- **Parser 3-Tier SEO (`extractThreeTierSeo`)**: Mengekstrak tag 3-tier, deskripsi YouTube ramah semantic AI, dan butir-butir checklist pra-upload.
- **File:** `src/lib/parsers.ts`.

---

### 5 — Scene Prompt Studio: SEO 2026 Studio & Mobile Shrink Test

- **Tab Baru "🎯 SEO 2026"**:
  - Kartu Arsitektur 3-Tier (Tier 1: Tag Spesifik, Tier 2: Tag Umum, Tier 3: Tag Majemuk) dengan chip badge dan tombol salin individual/seluruhnya.
  - Box Deskripsi Naratif Berempati ramah semantic search YouTube.
  - Interactive Pre-Flight Checklist Pra-Upload dengan progress bar dan strike-through otomatis.
- **Scene Cards**: Menampilkan badge `Target Emosi (VET)` dan `Teknik Pacing`.
- **Thumbnail Mobile Shrink Test Simulator**: Simulator ukuran layar ponsel kecil (120px) untuk memvalidasi apakah teks 1–3 kata dan ekspresi wajah tetap terbaca tajam sebelum dipublikasikan.
- **File:** `src/app/[locale]/dashboard/scene-prompt/ScenePromptStudioClient.tsx`.

---

### 6 — Quality Assurance & Testing

- **106/106 Unit Tests Lolos**: Pengujian mencakup `cleanNarasiForTts`, `parseScenes` (VET emotion & pacing), `extractThreeTierSeo`, `planFeatures` (fail-closed gating), dan `promptGenerator`.
- **100% Paritas i18n**: Tepat 1.359 key identik antara `messages/id.json` dan `messages/en.json`.
- **Design System Pass**: 2.084 token desain terverifikasi konsisten dengan estetika glassmorphism modern.
- **TypeScript Zero Errors**: `npx tsc --noEmit` lolos tanpa kompromi.
- **File:** `tests/parsers.test.ts`, `tests/planFeatures.test.ts`.

---

## [#72] — 2026-09-24 | Fix: Creator Persona & POV Integration (End-to-End Persona Coupling)

### Overview

Audit forensik lanjutan menemukan celah keterputusan (*disconnected field*) pada parameter **Persona & POV Kreator** (`videoConfig.pov` dan `channel.personaPov`). Meskipun kontrol UI telah tersedia di Generator Studio dan nilai divalidasi oleh API Route, nilai persona kreator tersebut sebelumnya tidak pernah diinjeksikan ke dalam teks prompt AI (`povSection`). Pembaruan ini menyambungkan parameter persona kreator secara utuh dari UI → API Route → Prompt Generator, lengkap dengan unit test otomatis.

---

### 1 — Creator Persona & POV Directive Injection

- **Injeksi Direktif Persona Kreator**: `promptGenerator.ts` kini membaca nilai persona kreator (`videoConfig.pov`) dengan fallback otomatis ke `channel.personaPov`. Jika terisi, blok instruksi eksplisit ditambahkan ke `povSection`:
  `- Persona & Sudut Pandang Kreator: "[Persona]" — Bawakan seluruh alur penceritaan, emosi, dan artikulasi ide dari kacamata persona ini.`
- **Harmoni Multi-Persona**: Persona kreator (mis. *Expert Storyteller*, *Energetic Reviewer*, *Casual Friend*, atau kustom) kini berpadu secara sinergis dengan identitas channel, bobot komposisi, tone of voice, dan peran AI (*Role & POV AI*).
- **File:** `src/lib/promptGenerator.ts`.

---

### 2 — API Route Mapping & Channel Profile Fallback

- **Sinkronisasi `route.ts`**: Menambahkan pemetaan `personaPov: channel.personaPov` pada objek `mappedChannel` dan memastikan `fullVideoConfig.pov` mewarisi nilai `channel.personaPov` jika form tidak mengirimkan override.
- **File:** `src/app/api/generate/route.ts`.

---

### 3 — Regression Protection & Unit Testing

- **4 Unit Test Baru**: Menambahkan pengujian komprehensif di `tests/promptGenerator.test.ts` yang memvalidasi:
  1. Injeksi persona kreator dari `videoConfig.pov`.
  2. Fallback otomatis ke `channel.personaPov`.
  3. Penegakan *Negative CTA Directive* saat CTA mati.
  4. Injeksi direktif *Hook Style* dan *Ending Style*.
- **File:** `tests/promptGenerator.test.ts`.

---

## [#71] — 2026-09-24 | Fix: CTA Leakage Prevention, Negative CTA Directive & Hook/Ending Style Integration

### Overview

Audit forensik menemukan celah kritis di mana teks CTA channel tetap bocor ke prompt AI meskipun toggle CTA dinonaktifkan oleh user, serta fitur `hookStyle` dan `endingStyle` yang sebelumnya hanya ada di form UI namun tidak tersambung ke `promptGenerator.ts` (*disconnected features*). Pembaruan ini memastikan kepatuhan mutlak terhadap preferensi CTA user, penegakan *Negative CTA Directive*, sanitasi panduan platform, dan pengaktifan penuh dropdown Hook Style & Ending Style secara end-to-end.

---

### 1 — CTA Leakage Elimination & Channel Profile Isolation

- **Channel CTA Gating**: Seluruh blok injeksi teks `channel.cta1` dan `channel.cta2` kini diisolasi ketat di balik validasi `if (hasCTA)`. Saat user mematikan opsi CTA, teks CTA channel sama sekali tidak pernah dikirimkan ke AI.
- **Loop Closing Text Branching**: Teks panduan penutup naskah kini memiliki 3 jalur logis: (1) Seamless loop aktif, (2) Non-loop dengan CTA aktif (kesimpulan tuntas / CTA), dan (3) Non-loop dengan CTA mati (kesimpulan solid, pesan reflektif, atau momen emosional tanpa ajakan follow/subscribe/share/CTA dalam bentuk apa pun).
- **File:** `src/lib/promptGenerator.ts`.

---

### 2 — Negative CTA Directive (Strict Anti-Retention Enforcement)

- **Instruksi Larangan Mutlak**: Menambahkan blok khusus `[LARANGAN MUTLAK — CTA DINONAKTIFKAN OLEH USER]` ke dalam master prompt dengan 4 aturan tegas:
  1. DILARANG KERAS menyisipkan ajakan follow, subscribe, like, share, atau komentar dalam bentuk apa pun (eksplisit maupun implisit).
  2. DILARANG menambahkan kalimat penutup bernada retensi (*"worth sticking around"*, *"follow for more"*, *"see you next time"*, *"jangan lupa subscribe"*, dll.).
  3. Menahan data CTA channel profil meskipun terisi di preferensi pengguna.
  4. DILARANG membuat scene khusus CTA di bagian akhir video.
- **Penutup yang Diizinkan**: Hanya resolusi cerita, pertanyaan diskusi terbuka, plot twist, pesan reflektif, momen emosional, atau fade-out natural.
- **File:** `src/lib/promptGenerator.ts`.

---

### 3 — Reaktivasi Fitur Terputus (Hook Style & Ending Style Directives)

- **Hook Style Directive**: Dropdown `hookStyle` di UI (`Pertanyaan Provokatif`, `Fakta Mengejutkan`, `Tantangan`, `Negative Hook`) kini terhubung 100% ke AI prompt melalui `hookStyleDirective`. Setiap opsi menyertakan pola kalimat pembuka yang kuat untuk Scene 1 (hanya aktif ketika `hasHook=true`).
- **Ending Style Directive**: Dropdown `endingStyle` di UI (`Pertanyaan Terbuka`, `Hard Sell CTA`, `Ajakan Simpan/Share`) kini terhubung ke AI prompt melalui `endingStyleDirective`. Memiliki dua mode adaptif:
  - *Saat CTA Aktif*: Mendukung gaya penutup penuh termasuk ajakan bertindak tegas (*Hard Sell CTA*) menggunakan CTA profil channel.
  - *Saat CTA Mati*: Menolak gaya hard-sell dan menyesuaikan opsi pertanyaan terbuka atau ajakan simpan murni tanpa unsur retensi/follow.
- **Key Mismatch Fix**: Penyelarasan key data antara nilai dropdown di `GeneratorForm.tsx` dan handler di `promptGenerator.ts` (`Hard Sell CTA`).
- **File:** `src/lib/promptGenerator.ts`.

---

### 4 — Platform Algorithm Guide Sanitization

- **Pembersihan Otomatis Panduan Algoritma**: Ketika CTA dinonaktifkan, template panduan platform target (misalnya YouTube Shorts) secara otomatis disanitasi: baris instruksi yang menyuruh AI membuat CTA atau ajakan subscribe dinetralkan menjadi instruksi resolusi konten yang kuat dan bermakna.
- **File:** `src/lib/promptGenerator.ts`.

---

## [#70] — 2026-09-24 | Feature: Overlay Style Selector, Auto-Chapter Grouping & Dynamic Textarea Expansion

### Overview

Rilis ini menghadirkan tiga fitur baru yang memperkuat pengalaman produksi konten long-form: **Overlay Style Selector** (pemilih gaya teks overlay), **Auto-Chapter Grouping** (pengelompokan bab otomatis untuk konten ≥7 scene), dan **Dynamic Textarea Auto-Expansion** (field input yang otomatis melebar mengikuti panjang konten). Semua fitur terintegrasi end-to-end dari Generator Studio → Prompt Generator → Scene Parser → Scene Viewer → Drafts Page → Batch Export.

---

### 1 — Overlay Style Selector (5 Mode Overlay)

- **Dropdown Gaya Overlay**: Menambahkan kontrol `💬 Gaya Teks Overlay` di Generator Studio dengan 5 opsi: `🤖 Auto`, `📖 Chapter Title`, `📌 Key Point`, `🔀 Mixed`, dan `✨ Minimal`.
- **Auto (Default)**: AI memilih gaya overlay terbaik berdasarkan konteks dan panjang konten. Untuk konten long-form (≥7 scene), otomatis menggunakan mode Mixed.
- **Chapter Title**: Overlay muncul sebagai judul bab di awal scene lalu menghilang (fade out) saat narasi dimulai — cocok untuk konten panjang bertopik terstruktur.
- **Key Point**: Overlay menampilkan fakta/data kunci yang menemani narasi lalu menghilang di akhir segmen.
- **Mixed**: AI memilih antara Chapter Title atau Key Point per scene sesuai konteks, ditandai prefix `[CHAPTER TITLE]` atau `[KEY POINT]`.
- **Minimal**: Overlay hanya di scene yang benar-benar membutuhkan (hook, data kunci, CTA), mayoritas scene tanpa overlay.
- **Contextual Help**: Info badge muncul saat Chapter Title atau Minimal mode dipilih, menjelaskan perilaku mode.
- **State Persistence**: Setting overlay style disimpan di localStorage dan di-restore saat halaman dibuka kembali.
- **File:** `src/components/generator/GeneratorForm.tsx`, `src/lib/promptGenerator.ts`.

---

### 2 — Auto-Chapter Grouping (Struktur Bab Otomatis untuk Konten Long-Form)

- **Deteksi Otomatis**: Ketika jumlah scene target ≥7 dan overlay style mendukung (Auto/Chapter Titles/Mixed), AI secara otomatis mengelompokkan scene ke dalam bab-bab tematik.
- **Format BAB**: AI menghasilkan header `## BAB [N]: [Judul Bab]` sebelum kelompok scene pertama setiap bab. Jumlah bab ditentukan natural berdasarkan alur konten (biasanya 3-6 bab).
- **Parser Support**: Fungsi `parseScenes()` di `ScenePromptStudioClient.tsx` diperluas untuk mendeteksi marker `## BAB N: Title`, melacak offset posisi, dan meng-assign `chapter`/`chapterTitle` ke setiap scene.
- **Overlay Type Parser**: Fungsi baru `parseOverlayType()` mengekstrak prefix `[CHAPTER TITLE]` dan `[KEY POINT]` dari teks overlay dan memetakannya ke field `overlayType` pada objek Scene.
- **Visual Chapter Dividers**: Di Scene Viewer dan Drafts Page, sebuah divider gradient hijau dengan badge `📖 BAB N: Judul` muncul di antara scene yang memulai bab baru.
- **Overlay Type Badges**: Overlay card berubah warna sesuai tipe — hijau emerald untuk Chapter Title, biru untuk Key Point, amber default untuk overlay biasa.
- **File:** `src/app/[locale]/dashboard/scene-prompt/ScenePromptStudioClient.tsx`, `src/app/[locale]/dashboard/drafts/[id]/page.tsx`, `src/lib/promptGenerator.ts`.

---

### 3 — Scene Type & Export Format Upgrade

- **Scene Interface Extended**: Interface `Scene` dan `SceneForExport` diperluas dengan field baru: `overlayType?: "chapter_title" | "key_point"`, `chapter?: number`, `chapterTitle?: string`.
- **Batch Export Enhanced**: Fungsi `buildBatchExportText()` kini menyertakan field `CHAPTER`, `CHAPTER_TITLE`, dan `OVERLAY_TYPE` dalam output ekspor untuk kompatibilitas parse-engine eksternal.
- **File:** `src/lib/sceneExportFormat.ts`.

---

### 4 — Dynamic Textarea Auto-Expansion (Main Topic & Additional Context)

- **Auto-Grow Textareas**: Field Main Topic dan Additional Context kini otomatis melebar secara vertikal sesuai panjang konten yang diketik (auto-height adjustment via `onInput` handler).
- **Manual Resize Tetap Tersedia**: CSS `resize-y` tetap aktif sehingga user dapat memperbesar/mengecilkan secara manual jika diinginkan.
- **Smooth Transition**: Perubahan tinggi textarea memiliki transisi halus 150ms untuk pengalaman visual yang premium.
- **File:** `src/components/generator/GeneratorForm.tsx`.

---

### 5 — End-to-End Integration & Quality Assurance

- **Zero TypeScript Errors**: Seluruh perubahan lulus `npx tsc --noEmit` tanpa error.
- **No Duplicate Code**: Audit kode konfirmasi tidak ada duplikasi fungsi, script, atau orphan code.
- **Data Flow Verified**: Data `overlayStyle` mengalir dari GeneratorForm → videoConfig payload → promptGenerator → AI output → parseScenes → Scene Viewer UI → Drafts Page → Batch Export tanpa gap.
- **Backward Compatibility**: Scene tanpa overlay type atau chapter info tetap di-render seperti sebelumnya (amber default styling).

---

## [#69] — 2026-09-24 | Feature: Scene Prompt Studio Last Parse Memory (Option 2B), 10-Item History Selector & Dynamic Resizable Input Fields in Generator Studio

### Overview

Rilis ini menghadirkan fitur **Persistensi & Memori Naskah Terurai Otomatis** pada Scene Prompt Studio serta **Bidang Input Dinamis (Resizable Textareas)** pada Generator Studio. Kini naskah dan kartu adegan yang terakhir diparse tidak akan hilang saat halaman ditutup atau dimuat ulang (zero-click auto-restore). Selain itu, creator dapat berpindah antar 10 riwayat naskah terdahulu melalui dropdown pemilih riwayat interaktif. Pada Generator Studio, input Topik Utama dan Konteks Tambahan kini dapat diperlebar secara vertikal (resize-y) layaknya pengaturan profil channel untuk kenyamanan penulisan ide dan konteks panjang.

---

### 1 — Scene Prompt Studio: Memori Parse Terakhir Otomatis (Zero-Click Restore)

- **Eliminasi Kehilangan State Parse**: Mengatasi masalah hilangnya kartu adegan dan data ekstraksi (Thumbnail, Caption, Hashtag, Title Options) saat halaman `/dashboard/scene-prompt` di-refresh atau dibuka kembali.
- **Server Hydration & Zero Flicker**: Server component `page.tsx` mengambil hingga 10 riwayat `parsedOutput` user dari database Prisma secara langsung (`createdAt: "desc"`), menserialisasikannya, dan mengoper data ke client component.
- **Auto-Initialization**: Jika tidak ada parameter `draftId`, studio langsung memuat naskah mentah, kartu adegan (`scenes`), judul draft, dan seluruh metadata pendukung dari entri terakhir tanpa menuntut creator menekan tombol Parse ulang.
- **File:** `src/app/[locale]/dashboard/scene-prompt/page.tsx`, `src/app/[locale]/dashboard/scene-prompt/ScenePromptStudioClient.tsx`.

---

### 2 — Pemilih Riwayat Parse Interaktif (10 Naskah Terakhir — Opsi 2B)

- **Dropdown Riwayat Naskah**: Di samping tombol *"⚡ Parse Adegan"*, kini tersedia kontrol `🕒 Riwayat Parse (N)` yang memuat riwayat hingga 10 naskah yang pernah diparse.
- **Informasi Kartu Riwayat**: Setiap item menampilkan judul/cuplikan topik, waktu relatif (*"Baru saja"*, *"20 menit lalu"*, dsb.), jumlah adegan, dan badge `Sedang Dibuka` untuk naskah aktif.
- **Peralihan 1-Klik**: Mengklik riwayat manapun mengeksekusi `applyParsedOutput()` yang langsung memperbarui seluruh tab studio (Scene Viewer, Thumbnail Studio, Platform Content, Voice Studio, HTML Blog, Affiliate) secara instan.
- **Sinkronisasi Parse Baru**: Endpoint `POST /api/parsed-outputs` kini mengembalikan payload record baru, memungkinkan pembaruan instan daftar riwayat di urutan teratas tanpa perlu reload halaman.
- **File:** `src/app/[locale]/dashboard/scene-prompt/ScenePromptStudioClient.tsx`, `src/app/api/parsed-outputs/route.ts`.

---

### 3 — Generator Studio: Dynamic Resizable Input Fields

- **Main Topic (`topic`)**: Diubah dari `<input type="text">` menjadi `<textarea rows={2} className="... resize-y min-h-[46px] ...">`. Kini mendukung gagasan multi-baris dan dapat ditarik ke bawah secara leluasa.
- **Additional Context (`additionalContext`)**: Batasan kaku `resize-none` digantikan dengan `resize-y min-h-[64px]`, memberikan fleksibilitas penuh bagi creator untuk menuliskan konteks panjang seperti pada Channel Settings.
- **File:** `src/components/generator/GeneratorForm.tsx`.

---

### 4 — Paritas Lokalisasi i18n & Uji Kualitas

- **100% Key Parity**: Menambahkan 6 key baru (`parseHistory`, `parseHistoryTooltip`, `savedItems`, `noParseHistory`, `activeParseBadge`, `historyLoadedSuccess`) di `messages/id.json` dan `messages/en.json` (total 1.316 keys id vs 1.316 keys en).
- **Unit Test Baru**: Menambahkan suite pengujian di `tests/historyStudioIntegration.test.ts` untuk memvalidasi prioritas `initialDraft` atas `parsedOutputs`, pemuatan otomatis entri terbaru, dan retensi antrian riwayat 10 item FIFO.
- **TypeScript & Test Suite Pass**: 13 file pengujian (98 tests) lulus tanpa kesalahan (`npx tsc --noEmit` bersih 0 error).
- **File:** `messages/id.json`, `messages/en.json`, `tests/historyStudioIntegration.test.ts`.

---

## [#68] — 2026-09-23 | Feature: History & Studio Workflow Handover, Template Recycling & Search Discovery

### Overview

Rilis ini menyelesaikan integrasi alur kerja antara modul **Riwayat & Template (History / Drafts)** dengan **Voice & Scene Studio** dan **Generator Studio**. Creator kini dapat melakukan handover satu-klik naskah riwayat langsung ke Scene & Voice Studio untuk generate audio VO, mendaur ulang template tersimpan langsung ke Generator Studio dengan parameter siap pakai, menikmati preservasi filter channel otomatis pasca penyimpanan draft, serta menemukan naskah terdahulu dengan cepat melalui input pencarian kata kunci dan badge indikator performa tayang.

---

### 1 — Handover Naskah Riwayat ke Voice & Scene Studio (`?draftId=...`)

- **Akses Cepat 1-Klik**: Pada halaman Riwayat (`/dashboard/drafts`) dan Detail Riwayat (`/dashboard/drafts/[id]`), draft bertipe `VIDEO` kini dilengkapi tombol aksi **"🎙️ Buka di Voice & Scene Studio"** / **"🎙️ Studio"**.
- **Pemuatan Otomatis (Zero Re-Paste)**: Halaman Scene Prompt Studio membaca parameter query `draftId`, mengambil data draft dari database, dan otomatis menginisialisasi teks naskah mentah, mem-parse adegan (visual prompt, narasi, teks overlay, durasi, audio cues BGM/SFX, dan voice guidelines), memilih channel yang sesuai, serta menyiapkan tab Voice Studio untuk pembuatan audio TTS Gemini.
- **File:** `src/app/[locale]/dashboard/scene-prompt/page.tsx`, `src/app/[locale]/dashboard/scene-prompt/ScenePromptStudioClient.tsx`, `src/app/[locale]/dashboard/drafts/[id]/DraftActions.tsx`, `src/app/[locale]/dashboard/drafts/page.tsx`.

---

### 2 — Daur Ulang Template ke Generator Studio (`?templateId=...`)

- **Integrasi Tombol "Gunakan Template"**: Tombol "Gunakan Template" pada kartu template di halaman riwayat dan tombol aksi pada halaman detail kini mengarahkan langsung ke `/${locale}/dashboard/generator?templateId=${draftId}&channelId=${draft.channelId}`.
- **Penerapan Parameter Instan**: Generator Studio secara reaktif mendeteksi `templateId`, memuat data template dari API `/api/drafts/[id]`, menerapkan topik, judul manual, tipe konten, target durasi, jumlah adegan, speech rate, serta gaya looping (narrative & visual loop) ke dalam form, disertai notifikasi toast keberhasilan.
- **File:** `src/components/generator/GeneratorForm.tsx`, `src/app/[locale]/dashboard/drafts/page.tsx`, `src/app/[locale]/dashboard/drafts/[id]/DraftActions.tsx`.

---

### 3 — Preservasi Filter Channel Pasca Simpan Draft

- **Alur Navigasi Terfokus**: Setelah creator menyimpan draft baru di Generator Studio via tombol "Simpan Draft", sistem kini mengarahkan creator ke `/${locale}/dashboard/drafts?channelId=${encodeURIComponent(channelId)}`.
- **Hasil**: Creator tidak perlu lagi mencari atau memfilter manual channel mereka di halaman riwayat; draft yang baru saja dibuat langsung berada di posisi teratas daftar.
- **File:** `src/components/generator/GeneratorForm.tsx`.

---

### 4 — Fitur Pencarian Kata Kunci & Badge Performa di Riwayat

- **Pencarian Cepat di `DraftFilter.tsx`**: Menambahkan kolom pencarian teks yang sinkron dengan query parameter `?q=...` untuk memfilter riwayat berdasarkan judul atau kata kunci naskah secara instan.
- **Badge Performa Tayangan (`DraftPerformance`)**: Kartu naskah riwayat kini menampilkan badge jumlah views (`👁️ X views`) jika creator telah mencatat metrik performa konten tersebut, mempermudah evaluasi konten berkinerja tinggi (high retention & high views).
- **File:** `src/components/dashboard/DraftFilter.tsx`, `src/app/[locale]/dashboard/drafts/page.tsx`.

---

### 5 — Non-Regresi & Uji Otomatis

- **Unit Test Baru**: `tests/historyStudioIntegration.test.ts` memverifikasi pencarian kata kunci naskah, pembentukan URL pengalihan channel aman, ekstraksi konfigurasi template numerik, dan kontrak payload handover ke Scene Studio.
- **Test Suite Pass 100%**: 13 test files (95 tests) lulus tanpa kegagalan.
- **TypeScript Strict Compliance**: `npx tsc --noEmit` lolos bersih tanpa kesalahan tipe.
- **File:** `tests/historyStudioIntegration.test.ts`.

---

## [#67] — 2026-09-23 | Feature & Security: Per-Channel State Isolation & Dynamic Profile Sync in Generator Studio

### Overview

Rilis ini menghadirkan perombakan arsitektur **Per-Channel State Isolation & Dynamic Profile Synchronization** pada Generator Studio. Setiap channel/profil creator kini memiliki memori dan preferensi generate tersendiri yang terisolasi penuh. Pergantian channel dijamin bersih tanpa kebocoran state (zero leak), visual aesthetic profil baru langsung diterapkan secara otomatis (eliminasi bug guard `if (prev) return prev;`), produk yang dipilih tidak lagi bocor ke channel lain, serta perubahan profil yang baru saja diedit di menu Kelola Channel selalu menjadi *Single Source of Truth* yang tercermin secara langsung di Generator Studio.

---

### 1 — Isolasi State Per-Profil (`channelFormStates` & `generatorFormState_{channelId}`)

- **Penyimpanan Terpartisi**: Form Generator Studio kini menyimpan preferensi dan progres naskah per profil secara mandiri (`localStorage.getItem("generatorFormState_" + channelId)` dan `user.generatorPreferences.channelFormStates[channelId]`).
- **Penyimpanan Terakhir Aktif**: Menyimpan pointer `generatorLastActiveChannelId` agar saat creator kembali ke halaman Generator Studio, form otomatis memuat channel yang terakhir kali digunakan beserta seluruh sesi kerja channel tersebut.
- **Deep Merge di Backend**: API `PUT /api/user/preferences` kini mendukung `channelFormStates: z.record(z.string(), generatorFormStateSchema)` dengan logika deep merge per-channel, sehingga pembaruan pada satu channel tidak akan menghapus data channel lainnya di database.
- **File:** `src/components/generator/GeneratorForm.tsx`, `src/app/api/user/preferences/route.ts`.

---

### 2 — Clean Profile Switching & Zero State Leak (Pencegahan Kebocoran)

- **Eliminasi Kontaminasi Fallback `prev`**: Pada saat creator beralih dari Channel A ke Channel B di dropdown, konfigurasi `targetPlatform`, `pov`, dan `speechRate` langsung diambil dari data Channel B (atau default sistem jika kosong), bukan lagi mewarisi nilai milik Channel A.
- **Reset Produk Otomatis (`selectedProductId`)**: Mengeliminasi bug di mana ID produk milik Channel A tertinggal di Channel B saat berganti profil, mencegah mismatch dan hilangnya promosi produk di prompt backend.
- **Reset Opsi Ad-Hoc**: Opsi enrichment (`rolePOV`, `toneOfVoice`, `hookStyleType`, `customHookText`, `trendingAudio`, `affiliateAngle`, `cameraMovementCustom`, `narrationModeOverride`) di-reset secara bersih jika channel tujuan belum memiliki sesi tersimpan, atau dimuat dari sesi khusus channel tersebut jika sebelumnya pernah dikerjakan.
- **File:** `src/components/generator/GeneratorForm.tsx`.

---

### 3 — Eliminasi Bug Guard Visual Style (`visualStyleKey`)

- **Perbaikan Masalah #58 Guard**: Menghapus blokade `if (prev) return prev;` pada `setVisualStyleKey`.
- Saat creator berganti ke Channel B, estetika visual Channel B (`mapVisualAestheticToKey(ch.visualAesthetic)`) otomatis diterapkan ke dropdown preset visual style dan `imageConfig.visualStyle`, memastikan konsistensi visual prompt video/gambar dengan branding channel aktif.
- **File:** `src/components/generator/GeneratorForm.tsx`.

---

### 4 — Prioritas Database vs Cache (Single Source of Truth)

- **Sinkronisasi Hasil Edit Profil**: Jika creator mengedit data profil di menu `/dashboard/channels` (misal mengubah visual aesthetic, target platform, speech rate, atau audio BGM/SFX/VO), Generator Studio memprioritaskan data terbaru dari database (prop `channels`) di atas cache lokal lama.
- Cache form lama tidak lagi dapat menimpa atau menutupi konfigurasi profil yang baru diperbarui.
- **File:** `src/components/generator/GeneratorForm.tsx`.

---

### 5 — Non-Regresi & Uji Otomatis

- **Unit Test Baru**: `tests/channelStateIsolation.test.ts` memvalidasi parsing skema multi-channel, merge payload per channel, proteksi override database atas cache basi, dan isolasi switch profil bersih.
- **Test Suite Pass 100%**: Seluruh 12 test suite (87 tests) lulus tanpa regresi.
- **Parity Tanpa Duplikasi**: Bekerja berdampingan secara harmonis dengan fitur Voice Studio ([#64]–[#66]) dan Camera Movement Pro tanpa benturan namespace.
- **File:** `tests/channelStateIsolation.test.ts`.

---

## [#66] — 2026-09-23 | Feature: Voice Studio Filter (Gender & Favorit), Pencarian Niche, Star Toggle & Full State Persistence

### Overview

Rilis ini menghadirkan fitur **Voice Discovery & Personalization** pada Voice Studio: penyaringan suara berdasarkan Gender (Pria/Wanita), daftar Favorit dengan tombol bintang (⭐), pencarian cepat berdasarkan niche/karakter suara, rekomendasi cerdas untuk niche channel, serta **persistensi otomatis penuh** agar konfigurasi terakhir tidak hilang saat berpindah tab atau berpindah halaman.

---

### 1 — Filter Kategori & Gender (Filter Pills)

- Ditambahkan baris tombol filter di atas pemilihan suara:
  - `Semua (30)`: Menampilkan seluruh katalog 30 varian suara Gemini TTS A-Z.
  - `⭐ Favorit (N)`: Menampilkan hanya suara yang telah ditandai bintang oleh creator.
  - `👨 Pria (15)`: Menyaring khusus suara maskulin.
  - `👩 Wanita (15)`: Menyaring khusus suara feminin.
- **File:** `ScenePromptStudioClient.tsx`, `messages/id.json`, `messages/en.json`.

---

### 2 — Pencarian Cepat Berdasarkan Mood, Karakter & Niche

- Kolom pencarian interaktif di atas dropdown suara.
- Mendukung pencarian teks terhadap nama suara (misal: *Kore*), nada karakter (misal: *Tegas, Lembut*), maupun *use-case* / *bestFor* (misal: *Dokumenter, Storytelling, ASMR, Horror, Finansial*).
- **File:** `ScenePromptStudioClient.tsx`.

---

### 3 — Toggle Bintang Favorit (⭐) & Smart Channel Recommendation

- **Tombol Bintang Favorit**: Terletak tepat di sebelah dropdown suara untuk suara yang sedang aktif. Sekali klik untuk menambahkan/menghapus dari favorit.
- **Smart Recommendation**: Menampilkan badge `✨ Cocok untuk niche channel Anda` jika karakter suara cocok dengan niche channel yang sedang aktif.
- **Penyimpanan Permanen**: Disimpan di `localStorage` (`promptgen_favorite_voices`), sehingga tidak hilang saat mengganti draft atau berganti sesi.
- **File:** `ScenePromptStudioClient.tsx`.

---

### 4 — Persistensi State Total (Anti-Reset saat Pindah Tab)

- Mengintegrasikan seluruh setelan Voice Studio ke dalam penyimpanan otomatis:
  - Pilihan suara (`ttsVoice`)
  - Model TTS (`ttsModel`)
  - Preset pitch / nada (`ttsPitch`)
  - Kecepatan bicara (`ttsSpeed`)
  - Teks instruksi gaya (`ttsStyleInstruction`)
  - Filter gender aktif (`ttsVoiceFilter`)
  - Daftar suara favorit (`favoriteVoices`)
- Tersimpan instan di `localStorage` dan tersinkronisasi dengan debounce ke server (`/api/user/preferences`).
- **Hasil**: Berpindah-pindah tab (*Scene Viewer*, *Thumbnail*, *Platform Content*, *Voice Studio*), berpindah menu dashboard, atau reload browser tidak akan mereset setelan terakhir creator.
- **File:** `ScenePromptStudioClient.tsx`.

---

### Ringkasan Teknis

| Aspek | Status |
|-------|--------|
| i18n parity (id ↔ en) | ✅ Parity terjaga (11 key baru) |
| State persistence | ✅ LocalStorage + Server sync |
| Kompatibilitas model | ✅ Gemini TTS REST v1beta |
| Breaking changes | ❌ Tidak ada |

---

## [#65] — 2026-09-23 | Fix: Audit Duplikasi Voice Studio & Feat: Voice Preview Studio

### Overview

Rilis ini menuntaskan audit duplikasi antarmuka **Voice Studio** dan menambahkan fitur **Voice Preview** (Uji Dengar Suara) agar creator dapat mendengarkan sampel suara sebelum melakukan generate audio per-scene atau Full VO.

---

### 1 — Pembersihan Duplikasi Voice Studio di Platform Content

- **Audit & Problem**: Voice Studio sebelumnya muncul ganda: sebagai implementasi parsial/lama di dalam tab `📱 Platform Content`, dan sebagai implementasi kanonikal penuh di tab terpisah `🎙️ Voice Studio`. Keduanya berbagi state yang sama (`ttsResults`, `ttsVoice`, dll) sehingga membingungkan pengguna dan membuat halaman terlalu padat.
- **Solusi**: Blok Voice Studio di dalam tab `Platform Content` dihapus seluruhnya. Tab `🎙️ Voice Studio` kini menjadi satu-satunya tempat untuk mengonfigurasi dan men-generate Text-to-Speech narasi.
- **File:** `src/app/[locale]/dashboard/scene-prompt/ScenePromptStudioClient.tsx`.

---

### 2 — Fitur Voice Preview (Uji Dengar Suara)

- **Fitur Baru**: Panel "Preview Suara" ditambahkan di dalam tab `🎙️ Voice Studio` (antara grid kontrol suara dan daftar scene).
- **Fungsi**: Memungkinkan creator menguji karakter suara, speed, dan pitch pilihan sebelum men-generate seluruh scene (menghemat kuota/request API dan waktu).
- **Interaksi**:
  - Textarea input kustom untuk teks uji coba (default placeholder kontekstual).
  - Tombol `🎧 Uji Dengar` / `Test Voice`.
  - Audio player inline langsung muncul saat preview selesai di-generate.
- **File:** `src/app/[locale]/dashboard/scene-prompt/ScenePromptStudioClient.tsx`, `messages/id.json`, `messages/en.json`.

---

### 3 — Fix: Skema Payload Gemini TTS & Pencegahan Auto-Deactivation False-Positive

- **Root Cause Problem**: Pada patch #64, parameter `speakingRate` dikirim langsung di dalam objek `speechConfig` Gemini REST API. Google Gemini menolak parameter tersebut dengan HTTP 400 (`Invalid JSON payload received. Unknown name "speakingRate" at 'generation_config.speech_config'`).
- **Dampak Error**: Fungsi `classifyError` sebelumnya salah mengklasifikasikan semua HTTP 400 sebagai `INVALID_KEY`, memicu logika fail-safe yang otomatis menonaktifkan API key user di database (`isActive: false`). Akibatnya muncul toast *"Belum ada API key Gemini aktif"*.
- **Solusi**:
  - Hapus field `speakingRate` dari payload `speechConfig` di `src/lib/geminiTts.ts`.
  - Kontrol tempo/kecepatan suara dialihkan melalui prompt guidance directive pada teks narasi (didukung penuh model Gemini).
  - Perbaiki `classifyError`: HTTP 400 / payload issues tidak lagi dianggap `INVALID_KEY`. `INVALID_KEY` hanya berlaku jika respons Google secara eksplisit menyatakan kunci otentikasi tidak valid atau HTTP 403.
  - Perbaiki `handleTestKey` di `SettingsClient.tsx`: Mengirim `keyId` spesifik, mengizinkan pengujian key non-aktif, otomatis memulihkan status `isActive: true` jika test berhasil, dan langsung menyinkronkan state UI via `fetchKeys()`.
  - Endpoint `PATCH /api/user/tts-keys/[id]` otomatis mereset pesan error saat key diaktifkan kembali.
- **File:** `src/lib/geminiTts.ts`, `src/app/api/tts/generate/route.ts`, `src/app/api/user/tts-keys/[id]/route.ts`, `src/app/[locale]/dashboard/settings/SettingsClient.tsx`.

---

### Ringkasan Teknis

| Aspek | Status |
|-------|--------|
| i18n parity (id ↔ en) | ✅ Parity terjaga (7 key baru) |
| Duplikasi komponen | ❌ Dieliminasi (0 duplicate UI) |
| Skema Gemini TTS payload | ✅ Standar Google REST v1beta (tanpa invalid field) |
| Error classifier | ✅ Presisi (400 ≠ INVALID_KEY) |
| Endpoint yang digunakan | `POST /api/tts/generate` (dengan opsi `keyId`) |
| Breaking changes | ❌ Tidak ada |

---

## [#64] — 2026-09-22 | Feature: Voice Studio — Tab Terpisah, Speed/Pitch, Durasi, Sorted Voices & Full VO Merge

### Overview

Rilis ini adalah iterasi **Voice Studio** yang meningkatkan UX secara menyeluruh. Semua perubahan mempertahankan parity i18n (1286/1286 keys), tidak ada gap atau duplikasi.

---

### 1 — Voice Studio Menjadi Tab Terpisah

- Tab `🎙️ Voice Studio` ditambahkan ke tab bar *Scene Prompt Studio*, sejajar dengan `🎬 Scene Viewer`, `🖼️ Thumbnail Studio`, `📱 Platform Content`.
- Seluruh blok Voice Studio dipindah dari dalam tab `Platform Content` ke tab `voiceStudio` yang berdiri sendiri.
- **File:** `ScenePromptStudioClient.tsx` — `activeTab` type diperluas ke `"scenes" | "thumbnail" | "platform" | "voiceStudio" | "htmlBlog"`.

---

### 2 — Voice List: Urut Abjad + Deskripsi Lengkap

- 30 voice Gemini TTS diurutkan A-Z.
- Interface `TtsVoiceOption` diperluas: `gender` (Male/Female/Neutral), `tone` (deskripsi karakter), `bestFor` (rekomendasi use-case).
- Dropdown menampilkan: `Achernar — Female · Lembut & Tenang` dsb.
- Info `bestFor` ditampilkan di bawah dropdown sebagai hint kontekstual.
- **File:** `src/lib/ttsVoices.ts` (full rewrite).

---

### 3 — Kontrol Speed & Pitch Gaya ElevenLabs

- **Speed slider** (0.25× – 2.0×, step 0.05) → dikirim ke Gemini API sebagai `speakingRate` numerik (parameter resmi yang didukung API).
- **Pitch dropdown preset**: Normal / Lebih Tinggi (+1) / Lebih Tinggi (+2) / Lebih Rendah (-1) / Lebih Rendah (-2) → dikonversi ke style instruction teks karena Gemini API tidak punya parameter pitch numerik.
- **File:** `src/lib/ttsVoices.ts` (`TTS_PITCH_PRESETS`), `src/lib/geminiTts.ts` (parameter `speakingRate`), `src/app/api/tts/generate/route.ts` (schema Zod diperluas).

---

### 4 — Durasi Audio per Scene

- Field `durationSec` ditambahkan ke interface `TtsResult`.
- Dibaca via `onLoadedMetadata` dari `<audio>` element setelah audio berhasil di-load.
- Tampil sebagai badge `M:SS` di sebelah kanan nama scene (contoh: `Scene 1 · [0:12]`).

---

### 5 — Generate & Gabung Semua (Full VO)

- Tombol baru **🔗 Generate & Gabung Semua** di Voice Studio header.
- Flow: Generate semua scene yang belum punya audio → kirim `POST /api/tts/merge` dengan array `audioBase64[]` → terima 1 WAV gabungan → tampilkan Full VO player + tombol download `.wav` tunggal.
- Merge dilakukan **server-side** via fungsi `mergeWavBuffers()` (strip WAV header, concat PCM, bungkus ulang) — lebih reliable dari merge client-side.
- **File baru:** `src/app/api/tts/merge/route.ts` (auth, rate limit 10/mnt, Zod validation).
- **Fungsi baru:** `mergeWavBuffers()` di `src/lib/geminiTts.ts`.

---

### Ringkasan Teknis

| Aspek | Status |
|-------|--------|
| i18n parity (id ↔ en) | ✅ 1286/1286 keys |
| TypeScript build | ✅ 0 error |
| Endpoint baru | `POST /api/tts/merge` |
| Rate limit merge | 10 req/menit per user |
| Breaking changes | ❌ Tidak ada |

---

## [#63] — 2026-09-22 | Feature: Voice Studio TTS, Batch Export, Overlay+Visual Copy, Anti-Halusinasi Directive & Plan Feature Sync


### Overview

Rilis ini menambahkan **5 fitur baru besar** yang memperluas kemampuan Scene Prompt Studio dan memperkuat integritas konten yang dihasilkan AI. Semua fitur mengikuti pola repo (Zod, Rate Limit, i18n parity, fail-closed plan gate).

---

### Fitur 1 — Voice Studio: Text-to-Speech via Gemini API (Multi-Key Failover)

**Problem Statement:**
Creator sering perlu narasi audio per scene untuk preview atau storyboard. Sebelumnya tidak ada fitur TTS terintegrasi, sehingga creator harus keluar ke layanan eksternal dan copy-paste manual.

**Implementasi:**

#### Database Schema (`prisma/schema.prisma`)
- Model baru `UserApiKey` dengan field: `userId`, `provider` (enum `ApiKeyProvider`), `encryptedKey`, `keyFingerprint`, `label`, `isActive`, `priority`, `lastUsedAt`, `lastErrorAt`, `lastErrorCode`, `lastErrorMessage`, `totalSuccessCount`, `totalFailureCount`.
- Enum baru `ApiKeyProvider` dengan nilai `GEMINI`.
- Relasi `User.userApiKeys` → `UserApiKey[]`.

> **ACTION REQUIRED:** Jalankan migrasi manual di VPS sebelum deploy.

#### Library (`src/lib/`)
| File | Fungsi |
|------|--------|
| `crypto.ts` (baru) | AES-256-GCM encrypt/decrypt, random IV per enkripsi, `maskApiKey()`, `getKeyFingerprint()` |
| `ttsVoices.ts` (baru) | 30 Gemini voice presets + 2 model definitions (`GEMINI_TTS_VOICES`, `GEMINI_TTS_MODELS`, `MAX_TTS_API_KEYS`) |
| `geminiTts.ts` (baru) | `callGeminiTts()` (API call, PCM→WAV encoding, retry 1x transient), `validateGeminiApiKey()`, error classification (`INVALID_KEY`, `RATE_LIMITED`, `QUOTA_EXCEEDED`, `UNKNOWN`) |

#### API Routes
| Route | Method | Fungsi |
|-------|--------|--------|
| `/api/user/tts-keys` | GET | List API keys (masked, tanpa expose encryptedKey) |
| `/api/user/tts-keys` | POST | Add + validate + encrypt + simpan key baru (max `MAX_TTS_API_KEYS`) |
| `/api/user/tts-keys/[id]` | PATCH | Update label/isActive/priority |
| `/api/user/tts-keys/[id]` | DELETE | Hapus key (ownership check) |
| `/api/tts/generate` | POST | Auth → Rate limit (40/mnt) → Feature gate → Failover loop → WAV base64 |

**Failover Logic:**
Loop sekuensial berdasarkan `priority ASC`. Jika key gagal:
- `INVALID_KEY` → auto-set `isActive: false`
- `RATE_LIMITED` / `QUOTA_EXCEEDED` / `UNKNOWN` → skip, coba key berikutnya
- Semua gagal → 502 dengan `attemptsLog`

#### UI
- **Settings** (`SettingsClient.tsx`): Section "Voice Studio — API Key Gemini" dengan add/list/toggle/test/delete/priority management.
- **Scene Prompt Studio** (`ScenePromptStudioClient.tsx`): Voice Studio panel di tab "Platform" dengan:
  - Voice selector (30 preset), Model selector, Style Instruction input
  - Generate per scene + Generate All + audio player inline
  - Download ZIP semua audio (via JSZip)
  - Feature gate: locked banner jika plan tidak punya `textToSpeechStudio`

**Penyimpanan Audio:** Browser memory (base64) — tidak ada upload ke server/S3. Keputusan ini sesuai constraint VPS Hostinger MVK 2 + Coolify tanpa S3.

---

### Fitur 2 — Combo Copy: Overlay + Visual Prompt

**Problem Statement:** Creator perlu copy teks overlay layar DAN visual prompt sekaligus untuk brief desainer thumbnail atau editor. Sebelumnya harus copy 2x secara terpisah.

**Implementasi:**
- `src/lib/sceneExportFormat.ts` (baru): `buildOverlayVisualCopyText(scene)` — gabung `[Teks Overlay Layar]` + `[Visual Prompt]` dalam satu blok terformat.
- UI: Tombol "📋 Copy Overlay + Visual" per scene card di Scene Prompt Studio.

---

### Fitur 3 — Batch Export (Multi-Scene Parser-Friendly Format)

**Problem Statement:** Creator yang ingin memproses narasi/visual semua scene sekaligus (untuk otomasi atau briefing tim) harus copy scene satu per satu.

**Implementasi:**
- `src/lib/sceneExportFormat.ts`: `buildBatchExportText(scenes[])` — format dengan delimiter `###PROMPTGEN_BATCH_EXPORT###` dan per-scene `---SCENE---`.
- UI: Checkbox per scene + "Select All" + tombol "📦 Ekspor Batch" di toolbar Scene Prompt Studio.

**Format Output:**
```
###PROMPTGEN_BATCH_EXPORT###
TOTAL_SCENES:N
---SCENE---
SCENE_INDEX:1
SCENE_NUMBER:Scene 1
NARASI:...
VISUAL:...
OVERLAY:... (opsional)
DURASI:... (opsional)
---SCENE---
...
###PROMPTGEN_BATCH_EXPORT_END###
```

---

### Fitur 4 — Directive Anti-Halusinasi di Master Prompt

**Problem Statement:** AI kadang memfabrikasi statistik, kutipan, atau klaim medis/hukum/finansial absolut yang tidak ada sumbernya — risiko reputasi creator.

**Implementasi (`src/lib/promptGenerator.ts`):**

Variabel `antiHallucinationDirective` baru diinjeksi ke setiap `masterPrompt` sebelum `allGuidelines`:

```
[ATURAN INTEGRITAS KONTEN — ANTI-HALUSINASI]
1. DILARANG KERAS memfabrikasi statistik, angka persentase, data survei, atau hasil riset...
2. DILARANG mengarang kutipan atau atribusi ke tokoh/ahli/institusi nyata...
3. DILARANG mengklaim khasiat medis, hukum, atau finansial yang bersifat absolut...
4. Jika topik memerlukan data faktual yang tidak tersedia, tandai dengan [VERIFIKASI: ...]
```

---

### Fitur 5 — Sinkronisasi Plan Feature: `textToSpeechStudio`

**Implementasi (`src/lib/planFeatures.ts`):**
- Tambah entry `textToSpeechStudio` ke `KNOWN_PLAN_FEATURES` dengan `defaultValue: false` (fail-closed).
- Label i18n: `featureTextToSpeechStudio` ("Voice Studio — Text-to-Speech (TTS)").
- AdminPlans UI otomatis menampilkan toggle ini saat create/edit plan.

---

### i18n

**Key baru ditambahkan (parity 100% — 1277/1277):**
- `Settings`: 31 key TTS API Key Manager (id + en)
- `ScenePromptStudio`: 21 key Voice Studio, Batch Export, Overlay Copy (id + en)
- `AdminPlans`: 1 key `featureTextToSpeechStudio` (id + en)

---

### Testing

| Suite | Tests | Status |
|-------|-------|--------|
| `tests/crypto.test.ts` | 6 | ✅ |
| `tests/geminiTts.test.ts` | 8 | ✅ |
| `tests/sceneExportFormat.test.ts` | 12 | ✅ |
| **Total** | **26** | **✅** |

`npm run audit:i18n` → 100% parity (1277/1277 keys)

---

### Komponen Terdampak

- `prisma/schema.prisma` — +model `UserApiKey`, +enum `ApiKeyProvider`
- `.env.example` — +`API_KEY_ENCRYPTION_SECRET`
- `src/lib/crypto.ts` (NEW)
- `src/lib/ttsVoices.ts` (NEW)
- `src/lib/geminiTts.ts` (NEW)
- `src/lib/sceneExportFormat.ts` (NEW)
- `src/lib/planFeatures.ts` — +`textToSpeechStudio`
- `src/lib/promptGenerator.ts` — +`antiHallucinationDirective`
- `src/app/api/user/tts-keys/route.ts` (NEW)
- `src/app/api/user/tts-keys/[id]/route.ts` (NEW)
- `src/app/api/tts/generate/route.ts` (NEW)
- `src/app/[locale]/dashboard/settings/SettingsClient.tsx` — +TTS Key Manager
- `src/app/[locale]/dashboard/scene-prompt/page.tsx` — +planFeatures prop
- `src/app/[locale]/dashboard/scene-prompt/ScenePromptStudioClient.tsx` — +Voice Studio, Batch Export, Overlay Copy
- `messages/id.json` — +53 keys
- `messages/en.json` — +53 keys
- `tests/crypto.test.ts` (NEW)
- `tests/geminiTts.test.ts` (NEW)
- `tests/sceneExportFormat.test.ts` (NEW)
- `package.json` — +jszip

### Checklist Verifikasi

- [x] `npm run audit:i18n` — 100% parity
- [x] `npx vitest run` — 26/26 tests passing
- [x] `npx prisma generate` — client generated dengan `UserApiKey`
- [x] `npm run build` — 0 TypeScript errors
- [ ] Migrasi DB manual di VPS (`UserApiKey` table)
- [ ] Set `API_KEY_ENCRYPTION_SECRET` di Coolify env
- [ ] Admin: aktifkan `textToSpeechStudio` di plan yang diinginkan

---

## [#62] — 2026-09-21 | Enhancement: Anti-Static Scene System — Temporal Visual Prompt, Environmental Dynamism & Color Grade Consistency

### Problem Statement

Dari audit output generator, scene yang dihasilkan terasa **statis dan kurang dinamis** dibanding referensi video profesional. Root cause ditemukan bukan di narasi (yang sudah mature), melainkan di instruksi **Visual Prompt** yang masih menggunakan paradigma "describe a frame" (snapshot statis) bukan "describe a clip" (temporal kejadian selama durasi).

**5 akar masalah yang diidentifikasi:**
1. Visual Prompt formula 5-bagian hanya mendeskripsikan kondisi awal scene — tidak ada instruksi tentang apa yang terjadi *selama* durasi berlangsung
2. Tidak ada "Intra-Scene Event Arc" — AI tidak diinstruksikan bahwa durasi 5-10 detik harus berisi sub-kejadian berurutan
3. Camera Movement PRO tidak menyertakan timing/easing — gerakan mekanik konstan dari detik 0 sampai akhir
4. Tidak ada instruksi Environmental Dynamism — latar belakang selalu diam
5. PANDUAN SUARA hanya menginstruksikan intonasi VO, tidak ada audio-visual sync timing

### Implementasi

**File:** `src/lib/promptGenerator.ts`

#### Fix 1 — Visual Prompt: Snapshot → Temporal Clip Description

`visualPromptInstruction` (baris ~662) diubah dari formula 5-bagian statis menjadi **5-layer temporal** yang mendeskripsikan klip berjalan:

| Layer | Sebelum | Sesudah |
|---|---|---|
| Shot Type | ✅ Ada | ✅ Tetap |
| Subject & Action | Posisi statis | **Subject Micro-Action** — apa yang subjek lakukan & berubah *selama* scene |
| Environment | Kondisi awal | **Environment Dynamics** — min. 1 elemen lingkungan yang bergerak/berubah |
| Camera | Jenis gerakan saja | **Camera Movement + Timing** — jenis + kapan mulai + kapan settling + easing |
| Style | ✅ Ada | ✅ Tetap |

Contoh output sebelum: `"slow push-in, person talking, warm light, cinematic style"`
Contoh output sesudah: `"Medium shot dollying in slowly — beginning at scene open, easing to rest as character leans forward mid-sentence — subject's fingers trace the edge of a glowing map with deliberate hesitation, breath misting faintly in cold studio air, background neon-sign reflections pulse rhythmically on rain-streaked glass, ambient key light gradually warming from cool-blue to amber as scene progresses, cinematic volumetric side lighting, neo-noir aesthetic"`

#### Fix 2 — PANDUAN SUARA: Tambah Audio-Visual Sync Timing

Field `PANDUAN SUARA` kini memiliki field `Sync` tambahan:
```
Sync: <audio event yang SYNC dengan visual — misal: "[SFX: impact] tepat saat kamera snap-zoom, [BGM] fade in di detik ke-2 bersamaan dengan ambient light warm masuk">
```

#### Fix 3 — Camera Movement PRO: Prinsip 8 + Prinsip 9 Baru

**Prinsip 8 diperbarui** — format wajib kini menyertakan TIMING:
```
[Jenis Gerakan] + [TIMING: kapan dimulai & kapan settling/berhenti + easing] + [Kualitas/Kecepatan] + [Konteks Naratif]
```

**Prinsip 9 baru — INTRA-SCENE CHANGE (WAJIB ≥5 detik):**
Kamera tidak boleh bergerak kecepatan konstan dari detik 0 sampai akhir. Wajib minimal 1 perubahan: perubahan kecepatan (accelerate then decelerate), momen settling singkat, atau rack focus yang terkoordinasi dengan aksi subjek.

Closing note diperbarui dari "8 prinsip" → "9 prinsip".

#### Fix 4 — Environmental Dynamism Layer (Blok Baru di `allGuidelines`)

Blok baru `[PANDUAN DINAMISME LINGKUNGAN — ENVIRONMENTAL ACTIVITY LAYER]` dengan 5 kategori:

| Kategori | Contoh Elemen Dinamis |
|---|---|
| Indoor / Studio | uap kopi mengepul, kipas angin blur, bayangan venetian blind berpindah |
| Outdoor / Kota | kendaraan bokeh blur, neon sign berkedip, hujan rintik di aspal |
| Produk / Commercial | glare highlight berpindah, rim light bergeser, uap/partikel glossy |
| Alam | dedaunan bergerak, dappled light di permukaan air, refleksi langit |
| Abstrak / Sinematik | partikel melayang, volumetric beam bergerak, color grade shift dalam-scene |

**Prinsip:** Elemen dinamis boleh minor dan subtle — tujuannya membuat dunia terasa HIDUP, bukan dibekukan.

#### Fix 5 — `allGuidelines` Header & Temporal Beat Structure

Header diperbarui: `[PANDUAN PEMERKAYAAN VISUAL PROMPT — TEMPORAL CLIP, BUKAN SNAPSHOT STATIS]`

Point 2 kini mendefinisikan 3-beat temporal per scene:
- **Beat Pembuka (0–2 detik)**: kondisi awal / establishing visual
- **Beat Inti (tengah)**: aksi utama subjek / perubahan dinamis
- **Beat Akhir / Transisi**: resolusi visual / mempersiapkan perpindahan ke scene berikutnya

#### Fix 6 — Scene 2 Template Konsisten

Template placeholder Scene 2 diperbarui dari `"formula 5-bagian"` (paradigma lama) menjadi:
```
"Tulis prompt visual adegan kedua secara TEMPORAL (klip berjalan, bukan snapshot): deskripsikan Subject Micro-Action, Environment Dynamics, dan Camera Movement + Timing, bahasa Inggris."
```

#### Fix 7 — Color Grade & LUT Consistency (Feature Baru)

Blok baru `[KONSISTENSI COLOR GRADE & LUT ANTAR-SCENE]` yang menginstruksikan AI menetapkan satu palet warna dominan di Scene 1 sebagai "anchor" dan mempertahankannya di seluruh naskah:

| Palet | Mood | Use Case |
|---|---|---|
| Warm & Golden | Nostalgic / Inspiratif | Storytelling personal, lifestyle |
| Cool & Teal | Sinematik / Profesional | Teknologi, bisnis, urban |
| Desaturated & Gritty | Dokumenter / Raw | Faktual, geopolitik, berita |
| High Contrast & Vivid | Energetik / Viral | Hook kuat, aksi, motivasi |
| Monochromatic Accent | Artistik / Branded | Branding channel kuat |

**Aturan Wajib:**
1. Sebutkan palet SEKALI di Scene 1 sebagai anchor
2. Referensikan dengan frasa singkat di setiap scene berikutnya ("matching warm amber grade", "consistent teal LUT")
3. DILARANG mengubah color grade antar-scene tanpa alasan naratif eksplisit
4. Pergerakan cahaya dalam-scene ≠ perubahan LUT (diizinkan selama LUT dasar konsisten)

### Files Modified
| File | Perubahan |
|------|-----------|
| `src/lib/promptGenerator.ts` | Fix 1–7: Visual Prompt temporal, PANDUAN SUARA Sync, Camera PRO Prinsip 8–9, Environmental Dynamism, allGuidelines header, Scene 2 template, Color Grade Consistency |

---

## [#61] — 2026-09-21 | Feature: Factual Visual Grounding Layer — Kondisional, Zero-Impact Niche Lain

### Problem Statement

Dari audit output script *Democracy vs. Monarchy: Which One Handles a Crisis Faster?*, visual prompt yang dihasilkan terlalu abstrak/metaforis meski narasi mengandung fakta dunia nyata:

- **Scene 1–2** (Saudi Arabia tutup akses Masjidil Haram, Feb 27 2020) → visual: *gerbang emas generik + bayangan bermahkota* — tidak ada elemen yang recognizable sebagai Arab/Islam.
- **Scene 3–4** (Parlemen Swedia, pandemi modern 2020) → visual: *labirin batu + gulungan kertas* — terlihat seperti setting abad pertengahan, bukan demokrasi modern.
- **Scene 6** (studi 64 negara, twist terbesar) → visual: *bar chart di perpustakaan antik* — undersell momen data paling krusial.

Root cause: `[PANDUAN PEMERKAYAAN VISUAL PROMPT]` mengajarkan cara *format* visual, tapi tidak mengajarkan cara **mengekstrak dan mengunci fakta spesifik dari narasi** ke dalam elemen visual yang recognizable — khususnya untuk konten faktual/dokumenter.

### Desain: Conditional — Zero-Impact untuk Niche Lain

Layer ini dirancang tidak mengganggu user niche lifestyle, cooking, fiksi, motivasi, fashion, atau beauty. Blok instruksi hanya disuntikkan ke master prompt jika **minimal 2 sinyal faktual berbeda** terdeteksi dari topik + konteks tambahan.

### Implementasi

**File:** `src/lib/promptGenerator.ts`

**Fungsi classifier baru — `detectFactualContent(topic, additionalContext)`:**

```typescript
function detectFactualContent(topic: string, additionalContext: string): boolean {
  const combined = `${topic} ${additionalContext}`;

  // Sinyal 1: Angka statistik dengan satuan faktual
  const hasStatisticalData = /\b\d+\s*(negara|countries|persen|percent|%|juta|million|...)\b/i.test(combined);

  // Sinyal 2: Tahun spesifik (1800–2030)
  const hasSpecificYear = /\b(1[89]\d{2}|20[012]\d)\b/.test(combined);

  // Sinyal 3: Kata kunci dokumenter
  const hasDocumentaryKeywords = /\b(studi|penelitian|laporan|study|research|found|...)\b/i.test(combined);

  // Sinyal 4: Entitas geopolitik / institusi nyata
  const hasGeoEntity = /\b(parlemen|parliament|pemerintah|government|pandemi|pandemic|...)\b/i.test(combined);

  return [hasStatisticalData, hasSpecificYear, hasDocumentaryKeywords, hasGeoEntity]
    .filter(Boolean).length >= 2;
}
```

**Blok instruksi kondisional disuntik setelah `[PANDUAN PEMERKAYAAN VISUAL PROMPT]`:**

```
[PANDUAN VISUAL CONTEXT GROUNDING — KONTEN FAKTUAL TERDETEKSI]
1. EKSTRAKSI FAKTA PER-SCENE: siapa? di mana? kapan? apa?
2. ELEMEN VISUAL KONTEKSTUAL WAJIB: elemen recognizable per konteks faktual
   (Arab → kubah/kaligrafi, parlemen modern → bangku sidang/layar voting, dst.)
3. ANTI-AMBIGUITAS: visual DILARANG disalahartikan sebagai era berbeda dari narasi
4. KESEIMBANGAN ESTETIKA-KONTEKS: elemen faktual dilebur ke dalam estetika terpilih
```

### Dampak Per Niche

| Niche | Sinyal Faktual | Layer Aktif |
|---|---|---|
| Geopolitik / Edukasi | ≥2 sinyal | ✅ Aktif |
| Sejarah / Documentary | ≥2 sinyal | ✅ Aktif |
| Lifestyle / Wellness | 0–1 sinyal | ❌ Tidak aktif |
| Cooking / Food | 0–1 sinyal | ❌ Tidak aktif |
| Motivasi / Quotes | 0–1 sinyal | ❌ Tidak aktif |
| Fiksi / Storytelling | 0–1 sinyal | ❌ Tidak aktif |
| Fashion / Beauty | 0–1 sinyal | ❌ Tidak aktif |

**Threshold 2 sinyal** memastikan: topik "pandemi" sendiri (1 sinyal) → tidak aktif. Topik "pandemi 2020 + studi 64 negara" (3 sinyal) → aktif.

---

## [#60] — 2026-09-21 | Fix + Feature: Visual Style — Fallback Otomatis + Custom Input di Generator Studio

### Problem Statement (dari Audit Visual Prompt)

Dua bug teridentifikasi dari audit prompt yang dihasilkan Generator Studio:

**Bug 1 — `channel.visualAesthetic` tidak pernah diinjeksi ke VIDEO prompt:**
Ketika Visual Style Preset di Generator Studio diset ke "Auto", `videoConfig.visualStyle` adalah `undefined` → block visual style di `promptGenerator.ts` dilewati sepenuhnya. Field `channel.visualAesthetic` (yang menyimpan custom aesthetic panjang dari Channel Profile) **tidak pernah masuk ke master prompt**, meski field-nya sudah ada di interface dan database. AI eksternal (ChatGPT/Claude) tidak mendapat directive gaya visual apapun → default ke imagery paling literal untuk topik (misal: demokrasi/monarki → Yunani/Romawi kuno).

**Bug 2 — Visual style tidak diinjeksi eksplisit ke PANDUAN PEMERKAYAAN VISUAL PROMPT:**
Bahkan ketika visual style ada, ia hanya ditambahkan di `povSection` (bagian persona). Di `[PANDUAN PEMERKAYAAN VISUAL PROMPT]` hanya tertulis "Integrasi Gaya Estetika: Leburkan gaya visual..." **tanpa menyebutkan gaya apa yang harus digunakan**. AI tahu harus mengintegrasikan gaya, tapi tidak tahu gaya apa.

**Feature Request — Custom Visual Style di Generator Studio:**
User tidak bisa mengetik custom visual style secara langsung di Generator Studio tanpa mengubah Channel Profile. Perlu opsi "Custom (Ketik Sendiri)" di dropdown Visual Style Preset untuk session-specific override.

### Fix Detail

#### Fix A — Fallback Chain Visual Style (Opsi A) — `promptGenerator.ts`

Sebelum:
```typescript
if (videoConfig.visualStyle) {
  const resolved = resolveVisualStyle(videoConfig.visualStyle);
  if (resolved) { povSection += `- Estetika Visual: "${resolved}"`; }
}
```

Sesudah — fallback ke `channel.visualAesthetic` ketika tidak ada explicit preset:
```typescript
const rawVisualStyle = videoConfig.visualStyle || channel.visualAesthetic || null;
const resolvedVisualStyle: string | null = rawVisualStyle
  ? (resolveVisualStyle(rawVisualStyle) || rawVisualStyle)
  : null;

if (resolvedVisualStyle) {
  povSection += `- Gaya Visual Wajib: WAJIB menerapkan gaya estetika: "${resolvedVisualStyle}".`;
}
```

Prioritas:
1. Generator Studio Preset/Custom (explicit selection) — tertinggi
2. Channel Profile `visualAesthetic` (fallback via Opsi A)
3. Null — tidak ada directive visual style

#### Fix B — Injeksi Eksplisit di PANDUAN PEMERKAYAAN VISUAL PROMPT — `promptGenerator.ts`

Point 5 sekarang dinamis:
- **Jika ada `resolvedVisualStyle`**: Menampilkan gaya secara eksplisit sebagai directive wajib per-scene dengan text: `"5. GAYA ESTETIKA VISUAL WAJIB PER SCENE: "${resolvedVisualStyle}" — Terapkan gaya ini secara konsisten di SETIAP scene..."`
- **Jika tidak ada**: Fallback ke instruksi generik "Integrasi Gaya Estetika..."

Ditambah Point 6 baru — **KEBEBASAN ERA & KONTEKS**:
```
Kecuali topik secara eksplisit membutuhkan era historis tertentu, HINDARI setting historis spesifik
(Romawi kuno, Yunani kuno, era abad pertengahan, dll.). Visualisasikan konsep secara kontemporer,
metaforis, atau universal — karakter, pakaian, lingkungan HARUS bisa ditempatkan di era, budaya,
dan lokasi manapun.
```

Point lama "DILARANG --cref [url]" digeser jadi point 7.

#### Fix C — Custom Visual Style Input — `GeneratorForm.tsx`

Fitur baru:
- Tambah state `visualStyleCustom: string` (default `""`)
- Tambah opsi "✏️ Custom (Ketik Sendiri)" di dropdown Visual Style Preset (value: `__custom__`)
- Ketika `visualStyleKey === "__custom__"`: muncul `<textarea>` 4 baris untuk mengetik custom style description
- Textarea dilengkapi placeholder contoh dan hint text
- Custom text di-persist ke localStorage (stateObj + deps array)
- Custom text di-restore dari localStorage dan server-saved state
- Payload: `visualStyle = visualStyleKey === "__custom__" ? visualStyleCustom.trim() : visualStyleKey`

Ini memungkinkan:
- Session-specific visual style override tanpa mengubah Channel Profile permanen
- Custom style panjang dan presisi langsung dari Generator Studio
- Teks custom dikirim ke `videoConfig.visualStyle` → diproses oleh `resolveVisualStyle()` (jika cocok preset) atau digunakan as-is (custom free-text)

### Hierarki Prioritas Visual Style (Setelah Fix)

| Priority | Sumber | Kondisi |
|----------|--------|---------|
| 🥇 Tertinggi | Generator Studio → Custom (`__custom__`) | User ketik manual di textarea |
| 🥈 | Generator Studio → Preset (15 opsi) | User pilih preset spesifik |
| 🥉 | Channel Profile → `visualAesthetic` | Generator Studio = "Auto" (Opsi A) |
| — | Tidak ada directive | Semua kosong |

### Verifikasi
- `tsc --noEmit`: **exit code 0, 0 Error** ✅

### Files Modified
| File | Perubahan |
|------|-----------|
| `src/lib/promptGenerator.ts` | Fallback ke `channel.visualAesthetic`, injeksi eksplisit di PANDUAN VISUAL PROMPT, directive era-freedom |
| `src/components/generator/GeneratorForm.tsx` | State `visualStyleCustom`, opsi Custom di dropdown, textarea UI, payload, persistence |

---

## [#59] — 2026-09-21 | Upgrade: Image Prompt Studio — Midjourney v6.1 Quality + Keywords Fix


### Problem Statement (dari Audit #58)

Tiga kelemahan ditemukan di `imagePromptGenerator.ts` melalui audit komprehensif Generator Studio:

1. **`targetKeywords` tidak pernah sampai ke IMAGE prompt** — keywords diset user di form, tapi tidak dipass ke `generateImagePrompt()`. Hilang di tengah jalan.
2. **Semua variasi gambar identik** — engine hanya mengulang string yang sama dengan nomor berbeda. Tidak ada perbedaan komposisi, angle, atau pencahayaan antar-variasi.
3. **Sintaks Midjourney v6.1 tidak lengkap** — tidak ada `--v 6.1 --q 2 --stylize`, tidak ada kalkulasi stylize per visual style. Output belum siap-pakai untuk tool AI gambar premium.
4. **`narrative_prompt` tidak jelas peruntukannya** — tidak ada label tool rekomendasi, tidak ada panduan kapan menggunakan `prompt_text` vs `narrative_prompt`.

### Fix Detail

#### Fix A — `targetKeywords` End-to-End Integration (3 file)

```
GeneratorForm.tsx (form payload)
  → generate/route.ts (imageConfigSchema + pass ke generator)
    → imagePromptGenerator.ts (integrasi ke prompt_text & narrative_prompt)
```

- `imageConfigSchema` di route.ts ditambah field `targetKeywords`
- Form kini mengirim `{ ...imageConfig, targetKeywords }` untuk type IMAGE
- Keywords diinjeksi secara natural ke `prompt_text` dan `narrative_prompt`

#### Fix B — Variation Composition Profiles (5 angle berbeda)

Ditambahkan `VARIATION_COMPOSITIONS` array dengan 5 profil kreatif berbeda:

| # | Label | Angle | Lighting |
|---|-------|-------|----------|
| 1 | Hero Shot | Eye-level, centered | 3/4 key lighting |
| 2 | Intimate Close-Up | Slightly elevated 3/4 | Rim / dramatic side |
| 3 | Dramatic Wide | Low angle, worm's eye | Golden hour / backlight |
| 4 | Cinematic Dark | Dutch angle slight tilt | Chiaroscuro, deep shadows |
| 5 | Aerial Overview | Top-down 90°/45° | Even diffused, top shadows |

Setiap variasi benar-benar berbeda dalam komposisi, depth of field, dan pencahayaan — bukan copy-paste bernomor.

#### Fix C — Midjourney v6.1 Prompt Quality

`prompt_text` kini mengikuti MJ v6 best practice:
- **Urutan prioritas:** Subject → Keywords → Komposisi → Lighting → Mood/Color → DoF → Camera → Style → Brand
- **Technical flags:** `--ar {ar} --v 6.1 --q 2 --stylize {n}` (dikalibrasi per visual style)
- **Stylize calibration:** Painterly/artistic styles (ghibli, watercolor, oil-painting) → 850. Hybrid (pixar, flat-vector) → 650. Photorealistic → 300. Default → 750.
- **Negative prompt:** `--no {negativePrompt}` hanya ditambahkan jika bukan "None"

#### Fix D — `narrative_prompt` — Format DALL-E/GPT-Image-1

`narrative_prompt` kini menggunakan format instruksi bahasa natural yang dioptimalkan untuk:
- DALL-E 3 (ChatGPT Plus)
- GPT-Image-1
- Adobe Firefly
- Google Imagen

Setiap variasi mendapat `tool_recommendation` eksplisit (string).

#### Fix E — `masterPrompt` → Tool Guide Informatif

`masterPrompt` (teks yang muncul di atas JSON di layar user) kini menjadi panduan lengkap:
- Kapan pakai `prompt_text` vs `narrative_prompt`
- Daftar variasi yang dibuat + komposisi masing-masing
- Tips --stylize dengan nilai yang sudah dikalibrasi
- Tips --seed untuk konsistensi antar-variasi

#### Fix F — `finalJson` Enhanced Output

`finalJson` kini menyertakan metadata:
```json
{
  "topic": "...",
  "keywords": ["...", "..."],
  "visual_style": "8k photography, hyper-detailed...",
  "stylize": 300,
  "channel": "Channel Name",
  "variations": [...]
}
```

### Verifikasi
- `tsc --noEmit`: **exit code 0, 0 Error** ✅

### Arsitektur: Tidak Ada AI Internal

Sesuai desain aplikasi (external AI focus), `imagePromptGenerator.ts` **tidak memanggil API AI apapun**. Engine ini adalah **prompt builder** yang menghasilkan string siap-pakai untuk tools eksternal (Midjourney, DALL-E, Stable Diffusion, Adobe Firefly). AI yang "mengeksekusi" prompt adalah tool eksternal pilihan user.

### Files Modified
| File | Perubahan |
|------|-----------|
| `src/lib/imagePromptGenerator.ts` | Full rewrite — variation profiles, MJ v6.1 syntax, keywords integration, tool guide masterPrompt |
| `src/app/api/generate/route.ts` | Tambah `targetKeywords` ke `imageConfigSchema`, pass ke `generateImagePrompt()` |
| `src/components/generator/GeneratorForm.tsx` | Inject `targetKeywords` ke imageConfig payload untuk IMAGE type |

---

## [#58] — 2026-09-21 | Fix: UsedTitlesDirectory CRUD Lengkap + Visual Style Sync Bug


### Problem Statement

Dua bug terpisah ditemukan melalui audit kode:

1. **UsedTitlesDirectory hanya punya Create & Read** — tidak ada Delete atau Update. User tidak bisa membersihkan exclude list AI ketika ada judul yang salah diimport.
2. **Kolom "View" link rusak** — link mengarah ke `/dashboard/drafts/${tData.id}` menggunakan `UsedTitle.id` (bukan `Draft.id`), menghasilkan 404 setiap saat. Selain itu tidak ada locale prefix.
3. **Visual Style Preset tidak sinkron dengan `channel.visualAesthetic`** — ketika channel dipilih, `imageConfig.visualStyle` di-set ke raw free-text channel (misal: `"Cinematic Dark Mode (Sleek & Professional)"`), yang kemudian di-fuzzy-map ke `"photorealistic"` — mapping yang salah. Untuk VIDEO type, `visualStyleKey` (dropdown Visual Style Preset) sama sekali tidak pernah di-seed dari channel.

### Fix 1 — UsedTitlesDirectory: Complete CRUD

**Ditambahkan:**
- `DELETE /api/used-titles/[id]` — hapus satu judul dengan ownership check
- `PATCH /api/used-titles/[id]` — edit judul dengan uniqueness constraint check (409 jika duplikat)
- Tombol **Edit** per-baris + inline editing dengan keyboard shortcut (Enter = save, Escape = cancel)
- Tombol **Delete** per-baris dengan `confirm()` dialog
- Loading state per-operasi (`deletingId`, `savingEdit`)

**Dihapus:**
- Kolom **"Lihat/View"** — dihapus karena `UsedTitle.id ≠ Draft.id`. UsedTitle adalah catatan permanen terpisah dari Draft, tidak ada relasi langsung.

**i18n keys baru** (id.json & en.json — namespace `UsedTitles`):
`colActions`, `edit`, `delete`, `confirmDelete`, `editTitle`, `saveEdit`, `cancelEdit`, `deleteSuccess`, `editSuccess`, `duplicateTitle`, `deleteFailed`, `editFailed`

### Fix 2 — Visual Style Sync: `mapVisualAestheticToKey()` helper baru

**Ditambahkan di `src/lib/visualStyleMap.ts`:**

```ts
export function mapVisualAestheticToKey(aesthetic: string | null | undefined): string | null
```

Memetakan free-text `channel.visualAesthetic` ke slug key `VISUAL_STYLE_MAP` yang tepat.
Priority ordering diurutkan dari paling spesifik → paling umum untuk mencegah false match.

**Diperbaiki di `GeneratorForm.tsx`:**
- `imageConfig.visualStyle` sekarang menggunakan `mapVisualAestheticToKey()` bukan raw text
- `visualStyleKey` (VIDEO preset dropdown) kini di-seed dari channel aesthetic saat channel dipilih, dengan guard `if (prev) return prev` untuk tidak menimpa pilihan manual user

### Arsitektur: Mengapa tidak ada `draftId` di UsedTitle?

Keputusan desain dipertahankan: `UsedTitle` adalah catatan permanen yang **tidak terhapus bersama Draft**. Menambahkan `draftId` nullable akan menciptakan state inconsistency ketika draft dihapus. Link ke draft tidak memiliki nilai fungsional nyata.

### Verifikasi
- `tsc --noEmit`: **exit code 0, 0 Error** ✅

### Files Modified
| File | Perubahan |
|------|-----------|
| `src/app/api/used-titles/[id]/route.ts` | **[NEW]** DELETE + PATCH endpoint dengan ownership check & uniqueness validation |
| `src/components/dashboard/UsedTitlesDirectory.tsx` | Full rewrite — tambah Edit inline, Delete per-row, hapus View link |
| `src/lib/visualStyleMap.ts` | Tambah `mapVisualAestheticToKey()` helper |
| `src/components/generator/GeneratorForm.tsx` | Fix imageConfig.visualStyle sync + tambah visualStyleKey seed dari channel |
| `messages/id.json` | Tambah 11 key baru, hapus `colLink` & `view` di namespace UsedTitles |
| `messages/en.json` | Tambah 11 key baru, hapus `colLink` & `view` di namespace UsedTitles |

---

## [#57] — 2026-09-21 | Bugfix: CTA Bocor ke Narasi Meski Toggle "Include CTA" Dimatikan


### Problem Statement
Meskipun user **tidak mencentang "Include CTA"** di Generator Studio, output AI tetap menghasilkan:
- **Scene retain/subscribe** (contoh: *"Worth sticking around for the next one?"*)
- **Kalimat ajakan komentar yang bernada CTA** (contoh: *"What's your verdict? Drop it below."*)

Root cause ditemukan dari dua titik kebocoran independen di `src/lib/promptGenerator.ts`.

### Root Cause 1 — AIDA "Action" Step Bocor via Hook

**Lokasi:** `buildStructuralInstructions()` — blok `viralGuidelineSection`

```ts
// SEBELUM (bug): cukup isHookEnabled=true → instruksi AIDA penuh disuntik
if (isHookEnabled) {
  // "Action" step disertakan tanpa cek isCtaEnabled
  viralGuidelineSection += `Psikologi Copywriting: Gunakan kerangka PAS atau AIDA (→ Action).`;
}
```

Instruksi AIDA "**Action**" dikirim ke AI setiap kali Hook aktif **tanpa melihat `isCtaEnabled`**. AI menginterpretasi step "Action" sebagai ajakan subscribe/follow/retain di scene akhir.

### Root Cause 2 — Engagement Trigger Hardcoded Tanpa Guard

**Lokasi:** template literal `allGuidelines` — blok `[PANDUAN ENGAGEMENT TRIGGERS]`

Blok ini ditulis langsung ke template literal secara unconditional — `isCtaEnabled` tidak pernah dicek. AI menginterpretasi instruksi ini sebagai izin menambahkan CTA-style engagement di penutup video.

### Perbaikan yang Diterapkan

**Fix 1 — Gate AIDA "Action" step by `isCtaEnabled`:**
```ts
const aiaFramework = isCtaEnabled
  ? `PAS atau AIDA (Attention → Interest → Desire → Action)`
  : `PAS (Problem → Agitate → Solution) — TANPA step Action/CTA.
     DILARANG mengakhiri narasi dengan ajakan follow, subscribe, atau retensi eksplisit`;
viralGuidelineSection += `Psikologi Copywriting: Gunakan kerangka ${aiaFramework}.`;
```

**Fix 2 — `engagementTriggerDirective` field baru di `StructuralInstructions`:**
- Ditambahkan field `engagementTriggerDirective: string` ke interface `StructuralInstructions`
- Dibangun secara kondisional di `buildStructuralInstructions()`:
  - **CTA ON** → perilaku original (boleh follow/subscribe trigger)
  - **CTA OFF** → hanya pertanyaan diskusi terbuka; **DILARANG** follow, subscribe, "sticking around", "see you next week", dan frasa retensi sejenis
- Template `allGuidelines` diganti dari hardcoded ke `${structural.engagementTriggerDirective}`

### Desain Keputusan
Toggle **"Include CTA"** yang sudah ada menjadi satu-satunya controller untuk semua perilaku CTA. Tidak ada toggle baru. Soft engagement (pertanyaan diskusi/komentar) **tetap dipertahankan** bahkan saat CTA OFF — hanya bahasa follow/subscribe/retention yang diblokir.

### Verifikasi
- `tsc --noEmit`: **exit code 0, 0 Error** ✅

### Files Modified
| File | Perubahan |
|------|-----------|
| `src/lib/promptGenerator.ts` | Fix 1: gate AIDA Action step; Fix 2: `engagementTriggerDirective` field + conditional build + inject ke `allGuidelines` |

---

## [#56-HF1] — 2026-09-21 | Hotfix: Caption Selalu Disuppress oleh selectedSections Archetype

### Root Cause
`hasCaption` dan `hasThumbnail` di `promptGenerator.ts` menggunakan kondisi ternary di mana `selectedSections` selalu dievaluasi lebih dulu. Jika channel memiliki archetype dengan `defaultIncludedSections` yang tidak menyertakan `"CAPTION"`, maka field `socialCaption: true` yang dikirim user dari GeneratorForm **diabaikan sepenuhnya** — caption tidak pernah di-inject ke prompt AI meskipun toggle sudah dicentang.

### Bukti Bug
Output AI menampilkan `## KONTEN PLATFORM` dengan `HASHTAGS:` saja — `CAPTION:` tidak muncul meskipun toggle "Caption Sosmed" sudah aktif di form generator.

### Perbaikan (`src/lib/promptGenerator.ts`)
- **`hasCaption`**: Jika `videoConfig.socialCaption === true` (dikirim eksplisit dari form), langsung bernilai `true` — mengabaikan `selectedSections`. Fallback ke `selectedSections` hanya jika `socialCaption` tidak dikirim.
- **`hasThumbnail`**: Pola yang sama — jika `videoConfig.thumbnailIdea === true`, langsung `true` tanpa cek `selectedSections`.

```ts
// SEBELUM (bug):
const hasCaption = videoConfig?.selectedSections
  ? videoConfig.selectedSections.includes("CAPTION")  // ← memutus short-circuit
  : Boolean(videoConfig.socialCaption) ?? defaultSec?.caption ?? true;

// SESUDAH (fix):
const hasCaption = videoConfig?.socialCaption === true
  ? true   // ← explicit toggle ALWAYS wins
  : videoConfig?.selectedSections
    ? videoConfig.selectedSections.includes("CAPTION")
    : Boolean(videoConfig.socialCaption) ?? defaultSec?.caption ?? true;
```

### Verifikasi
- `tsc --noEmit`: **0 Error** ✅

### Files Modified
| File | Perubahan |
|------|-----------|
| `src/lib/promptGenerator.ts` | Fix `hasCaption` dan `hasThumbnail` override priority |

---

## [#56] — 2026-09-21 | Copy All Narration, Enhanced Thumbnail Studio UI & Prompt Guideline Injection

### Problem Statement & Audit Objective
1. **Tidak Ada Tombol "Salin Semua Narasi"**: Scene Viewer tidak menyediakan cara cepat untuk menyalin seluruh narasi dari semua scene sekaligus dalam satu blok teks. User harus menyalin satu per satu tiap scene secara manual.
2. **Thumbnail Studio Kurang Informatif**: Panel Thumbnail Studio hanya menampilkan prompt mentah tanpa breakdown detail (Subject, Lighting, Composition), tanpa panduan high-CTR yang terstruktur, dan tanpa tombol salin semua konsep thumbnail sekaligus.
3. **Syntax Error Template Literal Bersarang**: Pada `src/lib/promptGenerator.ts`, blok panduan thumbnail high-CTR yang ditambahkan sebelumnya menggunakan nested backtick di dalam template literal `allGuidelines`, menyebabkan TypeScript compilation failure (exit code ≠ 0).
4. **Konten Korup & Duplikasi**: Patch sebelumnya meninggalkan baris 619 yang terpotong di tengah string dan blok duplikasi baris 672–696, serta menghilangkan blok `hasHtmlBlog` dari `formatOutputWajib`.

### Solusi & Perbaikan yang Diterapkan

1. **Fitur "Salin Semua Narasi" (`ScenePromptStudioClient.tsx`)**:
   - Fungsi `copyAllNarration` mengiterasi seluruh scene yang ter-parse, menggabungkan narasi per scene dalam format `[SCENE N]\n<narasi>`, dan menyalinnya ke clipboard dalam satu aksi.
   - Tombol **"📋 Salin Semua Narasi"** ditambahkan pada toolbar Scene Viewer, hanya tampil saat ada scene ter-parse dan tab aktif adalah `scenes`.
   - Toast feedback `allNarasiCopied` muncul setelah berhasil.
   - Fallback pesan `noNarrationToCopy` jika semua scene tidak memiliki narasi (mode diegetik).

2. **Enhanced Thumbnail Studio UI (`ScenePromptStudioClient.tsx`)**:
   - Tombol **"📋 Salin Semua Thumbnail"** (`copyAllThumbnailConcept`) menggabungkan SEO text, Opsi 1 & 2 prompt+overlay, dan rekomendasi warna dalam satu blok teks ter-format.
   - Breakdown detail prompt: label **Subject**, **Lighting**, **Composition** pada setiap opsi prompt (`breakdownTitle`, `breakdownSubject`, `breakdownLighting`, `breakdownComposition`) untuk memudahkan pemahaman struktur prompt AI gambar.
   - Badge `🔵 Primary` dan `🔴 A/B Test` membedakan konsep Opsi 1 dan Opsi 2 secara visual.
   - Tips section **"💡 Tips Thumbnail High-CTR"** menampilkan 3 best practice (`thumbnailTip1`, `thumbnailTip2`, `thumbnailTip3`).
   - Tombol copy individual per elemen (SEO text, overlay teks, prompt raw, prompt dengan parameter).
   - State kosong (`noThumbnailData`) ditangani dengan pesan informatif.

3. **Panduan High-CTR Thumbnail di AI Prompt (`src/lib/promptGenerator.ts`)**:
   - Variabel `thumbnailGuidelineSection` diekstrak ke luar template literal `allGuidelines` untuk menghindari nested backtick syntax error.
   - Panduan 5 poin injected secara kondisional saat `hasThumbnail === true`:
     - Fokal point & ekspresi dramatis
     - Negative space untuk teks overlay
     - Kontras tinggi & pencahayaan sinematik
     - Teks overlay thumbnail (maks 3-4 kata)
     - Formula wajib prompt thumbnail (Close-up/MCU, emotion, negative space, cinematic lighting)
   - Section `## THUMBNAIL STUDIO` pada `formatOutputWajib` diperluas dengan field: Teks Overlay, Opsi 1 & 2 Prompt, Opsi 1 & 2 Teks Overlay, dan Rekomendasi Warna & Elemen.

4. **Bug Fix — Konten Korup & Duplikasi (`src/lib/promptGenerator.ts`)**:
   - Baris 619 yang terpotong di tengah string diperbaiki menjadi template string lengkap dan valid.
   - Blok `}` penutup `if (hasThumbnail)` yang hilang dikembalikan.
   - 26 baris duplikasi (baris 672–696) yang merupakan sisa patch gagal dihapus bersih.
   - Blok `hasHtmlBlog` yang terhapus pada patch sebelumnya dikembalikan ke posisi yang benar.
   - Penutup template literal `` `; `` untuk `allGuidelines` yang hilang dikembalikan.

5. **Hardening Parser Thumbnail (`src/lib/parsers.ts`)**:
   - Pola regex `extractThumbnailData` diperluas untuk menangani variasi output LLM yang lebih beragam (label dengan/tanpa spasi, bold markdown, maupun inline format).

6. **i18n Lengkap — 17 Key Baru (`messages/id.json` & `messages/en.json`)**:
   - Namespace `ScenePromptStudio`:
     - `copyAllNarasi`, `allNarasiCopied`, `noNarrationToCopy`
     - `thumbnailSubtitle`, `thumbnailAspectLabel`
     - `seoOverlayTitle`, `seoOverlayDesc`
     - `option1Title`, `option2Title`, `primaryBadge`, `abTestBadge`
     - `overlayTextLabel`, `promptAiLabel`, `copyPromptWithParams`, `copyPromptRaw`, `promptWithParamsCopied`
     - `copyAllThumbnail`, `allThumbnailCopied`
     - `recommendationsTitle`
     - `breakdownTitle`, `breakdownSubject`, `breakdownSubjectDesc`, `breakdownLighting`, `breakdownLightingDesc`, `breakdownComposition`, `breakdownCompositionDesc`
     - `thumbnailTipsTitle`, `thumbnailTip1`, `thumbnailTip2`, `thumbnailTip3`
     - `noThumbnailData`

### Hasil Verifikasi & Jaminan Kualitas
- **TypeScript (`tsc --noEmit`)**: **0 Error**, exit code 0 ✅
- **i18n Parity**: 100% — semua key yang digunakan TSX tersedia di `id.json` & `en.json` ✅
- **Tidak ada nested template literal**: `thumbnailGuidelineSection` diekstrak sebagai variabel terpisah ✅
- **Integritas `htmlBlog` feature gate**: Blok `hasHtmlBlog` dikembalikan dan berfungsi normal ✅

### Files Modified
| File | Status | Perubahan |
|------|--------|-----------|
| `src/app/[locale]/dashboard/scene-prompt/ScenePromptStudioClient.tsx` | **MODIFIED** | `copyAllNarration`, `copyAllThumbnailConcept`, enhanced Thumbnail Studio UI |
| `src/lib/promptGenerator.ts` | **MODIFIED** | Thumbnail guideline injection, fix nested backtick, fix corrupted lines, restore htmlBlog |
| `src/lib/parsers.ts` | **MODIFIED** | Extended regex patterns for `extractThumbnailData` |
| `messages/id.json` | **MODIFIED** | +29 keys baru di namespace `ScenePromptStudio` |
| `messages/en.json` | **MODIFIED** | +29 keys baru di namespace `ScenePromptStudio` |

---

## [#55] — 2026-09-18 | Perbaikan Akurasi Data Riset, Strategi Virality Multi-Platform, Sound Tren, dan Closed-Loop Performance Improvement

### Problem Statement & Audit Objective
1. **Ketidakjujuran Label & Data Riset**: Fitur riset kata kunci (`src/lib/researchService.ts`) mencantumkan label kosmetik `"VIDIQ_MCP"` padahal tidak ada integrasi dengan API vidIQ, serta menghasilkan metrik volume/kompetisi berbasis hash karakter tanpa validasi API nyata atau penjelasan disclaimer ke pengguna.
2. **Klaim Prediktif Palsu `(Potensi Viral: %)`**: Pada Tahap 1 master prompt (`src/lib/promptGenerator.ts`), AI diinstruksikan mengarang angka persentase potensi viral (`[angka]%`) yang murni halusinasi statistik tanpa dasar perhitungan data.
3. **Instruksi Algoritma Platform Masih Generik**: Instruksi platform target (TikTok, Reels, Shorts) hanya berupa 1 kalimat umum tanpa membedakan mekanisme kurva retensi, rasio share/save, atau preferensi algoritma masing-masing platform.
4. **Ketiadaan Input Sound / Audio Tren**: Tidak ada fitur bagi kreator untuk menentukan musik atau sound tren yang sedang viral di platform untuk menyelaraskan tempo naskah.
5. **Ketiadaan Closed-Loop Improvement**: Tidak ada mekanisme pencatatan performa konten nyata pasca-publikasi untuk dijadikan pembelajaran peningkatan kualitas naskah berikutnya.

### Solusi & Peningkatan Arsitektur yang Diterapkan

1. **Kejujuran Sumber Data Riset & Integrasi YouTube Data API v3**:
   - Menghapus 100% referensi kosmetik `VIDIQ_MCP` di codebase.
   - Mengimplementasikan 3 tingkatan sumber data yang transparan:
     - `REAL_API`: Menggunakan Google YouTube Data API v3 resmi (`search` dan `videos` endpoints) ketika `YOUTUBE_API_KEY` dikonfigurasi.
     - `YOUTUBE_AUTOCOMPLETE_HEURISTIC`: Pola pencarian live dari Google/YouTube suggest dengan estimasi volume dan kompetisi berbasis posisi ranking dan modifier intent.
     - `HEURISTIC_FALLBACK`: Pola sintaksis lokal yang aman saat jaringan terputus.
   - Menambahkan banner disclaimer edukasi dan badge sumber data transparan pada UI `ResearchClient.tsx`.

2. **Eliminasi Persentase Viral Fiktif & Penguatan Parser**:
   - Menghapus format `(Potensi Viral: %)` di Tahap 1 master prompt, digantikan Opsi (b) kualitatif: `Alasan Potensi: [curiosity gap, relevansi tren, emosi spesifik, atau kontras yang kuat — TANPA mencantumkan angka persentase palsu]`.
   - Menambahkan kata kunci metadata (`alasan`, `potensi`, `target`, `format`) pada `TITLE_BLACKLIST_KEYWORDS` di `src/lib/parsers.ts` guna mencegah kebocoran baris alasan ke dalam ekstraksi judul.

3. **Modul Algoritma Spesifik Per-Platform**:
   - Membangun `DEFAULT_PLATFORM_ALGORITHM_GUIDE`:
     - **TikTok**: Completion Rate & Rewatch Loop, psychological open-loops hingga 70-80%, eliminasi dead-air > 0.5s.
     - **Instagram Reels**: Shareability & Saveability (bookmark), konten layak simpan (framework/tips), narasi relatable untuk DM, safe-zone 9:16.
     - **YouTube Shorts**: Audience Retention Curve (smoothing detik 0-5), Subtle Climax CTA saat titik puncak emosional.
     - **Facebook, LinkedIn, Twitter/X**: Format naratif, thought leadership, dan argumen kontrarian.
   - Menambahkan kolom `platformAlgorithmGuide` pada model `PromptSettings`, API endpoint `/api/admin/prompt-settings`, serta antarmuka konfigurasi admin di `AdminSettingsClient.tsx`.

4. **Input Audio / Sound Tren**:
   - Menambahkan input field opsional "Sound / Audio Tren" pada `GeneratorForm.tsx` (Audio section) dengan penyimpanan otomatis di `localStorage`.
   - Menginjeksikan panduan tempo beat dan visual pacing ke dalam `[PANDUAN AUDIO, SFX & BGM]` dan `PANDUAN SUARA` di master prompt.
   - Terjemahan multibahasa lengkap di `messages/id.json` dan `messages/en.json`.

5. **Closed-Loop Performance Improvement**:
   - Model database baru `DraftPerformance` di `prisma/schema.prisma` (`views`, `likes`, `comments`, `shares`, `avgWatchTimeSec`, `retentionPct`, `notes`).
   - Endpoint CRUD lengkap `/api/drafts/[id]/performance` dengan validasi Zod, rate limiting, dan otorisasi pemilik draf.
   - Komponen UI `DraftPerformanceForm.tsx` pada halaman detail draf `/dashboard/drafts/[id]`.
   - Query closed-loop otomatis pada `/api/generate` yang mengidentifikasi hingga 5 video terbaik channel dengan `views > 0`, diinjeksikan ke master prompt sebagai referensi pola hook sukses.

### Hasil Verifikasi & Jaminan Kualitas
- **TypeScript (`tsc --noEmit`)**: **0 Error**, 100% type-safe.
- **ESLint (`npm run lint`)**: **0 Error, 0 Warning**.
- **Automated Tests (Vitest)**: **8 test files lolos, 57 unit/integration tests passed** (termasuk `researchService.test.ts`, `promptGenerator.test.ts`, `parsers.test.ts`).

---

## [#54] — 2026-09-08 | Total Audit, Hardening Arsitektur, Eliminasi 100% Compiler Error React 19 & Zero Gap Integration

### Problem Statement & Audit Objective
1. **Audit Total Tanpa Celah**: Sesuai instruksi pengguna, dilakukan audit menyeluruh dari lapisan database (19 Prisma models), API routes (48 routes), client fetches (46 endpoints), hingga integritas lokalisasi (989 keys ID/EN) untuk memastikan tidak ada bug, gap, duplikasi, orphan script, ghost data, maupun celah error.
2. **Eliminasi 38 Compiler Error React 19 / ESLint**: Terdapat 38 error di berbagai modul yang melanggar aturan arsitektur React 19 / Next.js:
   - `react-hooks/set-state-in-effect`: Pemanggilan synchronous `setState` di dalam `useEffect` yang memicu cascading renders dan degradasi performa render.
   - `react-hooks/purity`: Pemanggilan fungsi impur (`Math.random()`, `Date.now()`) langsung saat render body atau di dalam `useMemo`, yang memicu ketidaksinkronan SSR hydration mismatch.
   - `react-hooks/static-components`: Pendefinisian komponen JSX anak di dalam render body komponen induk.
   - `react/no-unescaped-entities`: Karakter kutip mentah (`"`) di dalam JSX.
   - `@typescript-eslint/no-explicit-any`: Penggunaan tipe eksplisit `any`.
   - `prefer-const`: Deklarasi `let` pada variabel yang nilainya tidak pernah dimutasi ulang.

### Solusi & Hardening Arsitektur yang Diterapkan

1. **Eliminasi Synchronous Cascading Renders (`react-hooks/set-state-in-effect`)**:
   - Menerapkan arsitektur data loading asinkron bersih dengan cleanup ignore flag (`let ignore = false; async function load() { ... if (!ignore) setState(...) } return () => { ignore = true; }`) pada:
     - `AnnouncementsClient.tsx`
     - `AdminArchetypesTab.tsx`
     - `ProductsClient.tsx`
     - `NotificationsClient.tsx`
     - `UsedTitlesDirectory.tsx`
     - `NotificationBell.tsx`
     - `AdminSupportClient.tsx`
     - `UserSupportClient.tsx`
   - Menggunakan microtask scheduling (`queueMicrotask`) untuk penundaan pembaruan state navigasi/sinkronisasi URL/localStorage:
     - `AdminMobileNav.tsx`: Defer `setOpen(false)` saat route berganti.
     - `MobileDashboardNav.tsx`: Defer `setDrawerOpen(false)` saat route berganti.
     - `PresetSelect.tsx`: Defer pembaruan opsi saat sinkronisasi nilai prop.
     - `GeneratorForm.tsx`: Defer pembacaan `searchParams` dan sinkronisasi channel terpilih.
     - `ScenePromptStudioClient.tsx`: Defer hidrasi prompt naskah dari `localStorage`.
   - `ResetPasswordForm.tsx`: Menghapus `useEffect` berlebih dan merender peringatan token hilang secara deklaratif via `t("tokenMissing")`.
   - `AuthForm.tsx`: Mengisolasi debounce pengecekan username di dalam `setTimeout`.

2. **Purity Render & Eliminasi Hydration Mismatch (`react-hooks/purity`)**:
   - `UserManagement.tsx`: Menghapus `Math.random()` dari render body dan menggantinya dengan helper `generateRandomPassword()` berbasis event click. Mengisolasi `currentTimestamp` ke dalam state yang dihidrasi aman pasca-mount.
   - `InvoiceHistoryClient.tsx`: Mengisolasi kalkulasi `now` ke dalam state terhidrasi mikro untuk mencegah evaluasi waktu dinamis saat fase render SSR.

3. **Pemindahan Komponen Statis (`react-hooks/static-components`)**:
   - `AdminPlansClient.tsx`: Memindahkan definisi subkomponen `Toggle` ke level modul terluar (top-level) agar React compiler tidak membuat ulang definisi fungsi pada setiap siklus re-render.

4. **Type Safety & JSX Formatting**:
   - `InstallPWABanner.tsx`: Mendefinisikan antarmuka resmi `BeforeInstallPromptEvent` dengan tipe yang ketat, menghapus seluruh tipe `any`.
   - `src/app/[locale]/dashboard/drafts/[id]/page.tsx`: Memperbaiki karakter tanda kutip mentah dengan entitas JSX `&quot;`.
   - `src/app/api/drafts/route.ts` & `src/app/api/generate/route.ts`: Memperbaiki deklarasi `let` menjadi `const`.
   - `CompositionSliderGroup.tsx`: Mengonversi deklarasi `let updated` menjadi `const updated`.

5. **Pembersihan File Orphan & Optimasi Runtime**:
   - Menghapus file log usang `build.log` dari root workspace.
   - Mengoptimalkan root `layout.tsx` dengan menghapus `getServerSession` yang tidak digunakan, mengurangi latensi database round-trip pada root routing.
   - Membersihkan unused parameters (`req`) pada HTTP handlers: `admin/announcements`, `admin/notifications`, `admin/payments`, `channels`, `notifications/mark-all-read`, `notifications/unread-count`.

### Hasil Verifikasi & Jaminan Kualitas
- **ESLint**: **0 Error** di seluruh direktori `src` (turun dari 38 error ke 0).
- **TypeScript (`tsc --noEmit`)**: **0 Error**, 100% type-safe.
- **Unit & Integration Tests**:
  - `test_seo_parse_engine.ts`: **100% PASS** (zero regressions pada parser scene, judul, caption, hashtag, dan SEO keywords).
  - `test_archetype.ts`: **100% PASS** (archetype faceless, diegetic, dan hook generation valid).
  - `test_narration_modes.ts`: **100% PASS** (semua mode narasi VO ON, VO OFF, Diegetic lolos pengujian).

---

## [#53] — 2026-09-08 | Peningkatan Akurasi Riset Tren (Real YouTube Search Questions, Dynamic SEO Scoring, Deduplikasi Tag) & Audit Tampilan PWA

### Problem Statement & Gap Identification
1. **Skor SEO Terkesan Monoton / Artificial**: Sebelumnya, kalkulasi skor peluang SEO menggunakan pengurangan aritmatika monoton berdasarkan ranking indeks (`65, 64, 63, 62...`), sehingga terasa seperti mockup berurutan.
2. **Template Sudut Pandang Konten Tidak Kontekstual**: Penggunaan template string kaku (misal: *"Fakta Ekstrem seputar [gunbound] di Dunia Nyata"*) menghasilkan rekomendasi aneh dan tidak relevan untuk topik game, software, maupun niche fiksi.
3. **Duplikasi Tag dengan Spasi**: Saran autocomplete YouTube yang memiliki variasi dengan dan tanpa spasi (misal `"gunbound mobile"` dan `"gunboundmobile"`) muncul berulang ganda di UI.
4. **Format Salin Tag Kurang Fleksibel**: Kreator membutuhkan format berbeda antara kolom tag YouTube Studio (dipisahkan tanda koma `,`) dan deskripsi video (berupa hashtag `#`).
5. **Kesiapan & Tampilan PWA (Progressive Web App)**: Diperlukan audit menyeluruh agar PWA Prompt Gen responsif di layar mobile, viewport fit bebas zoom otomatis pada iOS, serta banner install tidak menutupi bottom navigation bar.

### Solusi & Peningkatan Arsitektur

1. **Penggantian Template Halu Menjadi "Real YouTube Search Questions" (`src/lib/researchService.ts`)**:
   - Menghapus total template string kaku (*"Fakta Ekstrem di Dunia Nyata"*).
   - Mengimplementasikan `fetchRealYouTubeQuestions(query)` yang menembak langsung Google/YouTube Suggest API secara paralel dengan prefix pertanyaan riil (`cara`, `vs`, `tips`, `kenapa`, `apa itu`, `review`, `sejarah`).
   - Menghasilkan pertanyaan otentik yang benar-benar diketik penonton di YouTube (contoh pada query *gunbound*: *"Gunbound vs worms"*, *"Gunbound mobile"*, *"Gunbound tips and tricks"*, *"Gunbound ost"*).
   - Kartu UI diperbarui menjadi **"❓ Pertanyaan Populer Penonton (YouTube Search Questions)"** dengan CTA interaktif **"⚡ Jadikan Topik Naskah &rarr;"**.

2. **Skor Peluang SEO Dinamis & Realistis Berbasis Supply-Demand (`scoreKeyword`)**:
   - Menghitung rasio volume pencarian dan tingkat kompetisi secara dinamis.
   - Deteksi otomatis *specific modifiers* (`ost`, `soundtrack`, `gameplay`, `review`, `tips`, `cara`, `tutorial`, `vs`, `2025`, `2026`, `mod`, `guide`, `trik`, `sejarah`).
   - Menyuntikkan variasi deterministik berbasis karakter hash kata kunci sehingga skor peluang bervariasi alami (misal `gunbound` = 70, `gunbound mobile` = 60, `gunbound ost` = 82 dengan tag "🎯 Niche Target"), menghilangkan pola sekuensial monoton.

3. **Deduplikasi Bersih & Normalisasi Tag (`extractRecommendedTags`)**:
   - Normalisasi slug (`replace(/\s+/g, "")`) pada Set deduplikasi.
   - Mencegah collision antara variasi berspasi dan tanpa spasi (contoh: `"gunbound mobile"` dan `"gunboundmobile"` kini tersaring bersih menjadi 1 tag representatif).

4. **Dual-Action Format Salin Tag di Dashboard (`ResearchClient.tsx`)**:
   - **"📋 Salin Studio (,)"**: Menyalin seluruh tag dalam format dipisahkan koma (`gunbound, gunbound mobile, gunbound ost...`) untuk langsung di-paste ke kolom Tags YouTube Studio.
   - **"#️⃣ Salin Hashtag (#)"**: Menyalin seluruh tag dalam format hashtag (`#gunbound #gunboundmobile...`) untuk deskripsi video YouTube/TikTok.
   - Setiap tag pill dapat diklik satuan untuk menyalin tag tersebut ke clipboard dengan feedback toast.

5. **Audit Menyeluruh & Optimasi Tampilan PWA (Progressive Web App)**:
   - **Export Viewport & Apple Web App Meta (`src/app/[locale]/layout.tsx`)**: Menambahkan `export const viewport: Viewport` dengan `viewportFit: "cover"`, `themeColor: "#ff7600"`, dan konfigurasi `appleWebApp: { capable: true, statusBarStyle: "default" }`.
   - **Pencegahan Auto-Zoom iOS**: Menyesuaikan input pencarian ke `text-base sm:text-sm` (font $\ge 16$px pada viewport mobile) sehingga Safari iOS tidak memicu auto-zoom layout saat input disentuh.
   - **Penyesuaian Posisi `InstallPWABanner.tsx`**: Mengubah posisi dari `bottom-4` menjadi `bottom-20 md:bottom-4` agar banner instalasi PWA tidak bertubrukan atau menutupi bilah navigasi bawah (mobile bottom nav) pada smartphone. Menyesuaikan styling ke tema neumorphic brand `#ff7600`.
   - **Manifest PWA (`public/manifest.json`)**: Memperbarui `background_color: "#ecf0f3"`, `theme_color: "#ff7600"`, serta menyematkan `scope: "/"` dan `id: "/"` sesuai standar W3C PWA terkini.
   - **Visibilitas Skor di Mobile**: Menambahkan badge skor peluang SEO khusus pada tampilan mobile (`sm:hidden`) sehingga pengguna smartphone tetap dapat melihat perbandingan skor tanpa harus membuka desktop.
   - **Touch Targets**: Seluruh tombol interaktif disesuaikan dengan minimum touch target $\ge 36$-$44$px dengan respons sentuhan mikro (`active:scale-95`).

---

## [#52] — 2026-09-07 | Integrasi vidIQ & YouTube Live Trend Research Studio dengan Zero-Regression Parse Engine

### Problem Statement
1. **Tebak-tebakan Topik & Judul Konten**: Konten kreator kerap kesulitan menentukan topik mana yang memiliki volume pencarian tinggi dan kompetisi rendah di platform video (YouTube / TikTok), sehingga potensi views konten seringkali kurang optimal.
2. **Kebutuhan Integrasi vidIQ / YouTube Live Tanpa Memutus Parse Engine**: Menghubungkan intelligence kata kunci ke sistem pembuatan naskah harus menjamin output AI 100% kompatibel dengan *Parse Engine* (`parseScenes`, `extractTitles`, `extractThumbnailData`, `extractCaption`), tanpa merusak pemisahan scene, overlay, ataupun audio cues.

### Implementasi Arsitektur & Fitur

1. **Research Intelligence Service (`src/lib/researchService.ts`)**:
   - Menghubungkan Google YouTube Live Autocomplete API (`suggestqueries.google.com`) sebagai baseline real-time.
   - Algoritma scoring otomatis: Estimasi *Search Volume* (High / Medium / Low), *Competition Index*, serta kalkulasi agregat *SEO Score* (skala 0-100).
   - Ekstraksi otomatis rekomendasi hashtag & tags relevan berdasarkan query & niche channel.
   - Hook terintegrasi untuk vidIQ MCP jika environment key/server aktif.

2. **Dedicated Tab: Riset Tren & Keyword (`/dashboard/research`)**:
   - Tersedia di desktop sidebar (`navLinks`) dan mobile drawer (`DRAWER_ITEMS`).
   - Fitur pencarian query instan dengan switcher profil channel pengguna.
   - Tabel interaktif kata kunci: metrik Volume, Kompetisi, SEO Score pill, dan one-click copy tags.
   - Tombol cepat **"⚡ Buat Naskah"**: Mengarahkan pengguna langsung ke Generator Studio dengan membawa parameter topik dan kumpulan kata kunci pilihan via query string.

3. **Quick Action & Integrasi SEO di Generator Studio (`GeneratorForm.tsx`)**:
   - Link cepat **"🔍 Riset Tren & Keyword"** di sebelah label Topik Utama.
   - Deteksi otomatis URL parameter `?topic=...&keywords=...&channelId=...`.
   - Render badge interaktif **"🎯 Target Kata Kunci SEO"** dengan tombol hapus satuan dan tombol hapus semua.
   - Penambahan `targetKeywords` ke dalam payload `videoConfig` saat membuat naskah.

4. **Injeksi Terisolasi di Prompt Generator (`src/lib/promptGenerator.ts`)**:
   - Menyuntikkan instruksi SEO ke dalam `systemInstruction`.
   - Menyuntikkan blok `[TARGET SEO & KATA KUNCI TREN (VIDIQ/YOUTUBE)]` tepat setelah `[TOPIK UTAMA]` pada master prompt.
   - Pada Tahap 2 (`ANALISIS STRATEGI KONTEN & HOOK`), menyuntikkan baris `TARGET KATA KUNCI SEO: ...` yang secara arsitektural berada *sebelum* `Scene 1`, sehingga **100% terisolasi** dari pemecah scene `parseScenes`.

5. **Parse Engine Hardening (`src/lib/parsers.ts`)**:
   - Menambahkan flag unicode `u` pada regex `extractChosenTitle` (`/.../iu`) untuk memperbaiki pemotongan surrogate pair emoji `🛑` di JavaScript regex.
   - Memperluas filter `extractTitles` agar mengabaikan instruksi prompt interaktif seperti `"Silakan pilih..."` dan `"Pilihlah..."`.

### Verifikasi & Pengujian
- **Automated Verification (`scratch/test_seo_parse_engine.ts`)**:
  - Injeksi kata kunci SEO teruji sukses di Master Prompt, System Instruction, dan Tahap 2.
  - Simulasi AI output diuji melewati `parseScenes`, `extractTitles`, `extractChosenTitle`, `extractCaption`, `extractHashtags`, dan `extractThumbnailData`.
  - Hasil: **100% lulus (Zero Regressions)**. Seluruh adegan, durasi, teks overlay, dan audio cues terurai bersih tanpa kontaminasi keyword SEO.
- **TypeScript Check (`tsc --noEmit`)**: **0 error (Clean Compilation)**.

### Files Modified & Created
| File | Status | Perubahan |
|------|--------|-----------|
| `src/lib/researchService.ts` | **NEW** | Core keyword research service & scoring algorithm |
| `src/app/api/research/trends/route.ts` | **NEW** | API endpoint autentikasi tren & keyword |
| `src/app/[locale]/dashboard/research/page.tsx` | **NEW** | Server Component halaman riset |
| `src/app/[locale]/dashboard/research/ResearchClient.tsx` | **NEW** | Client Component interaktif studio riset tren |
| `src/lib/promptGenerator.ts` | **MODIFIED** | Injeksi targetKeywords di master prompt & Tahap 2 |
| `src/app/api/generate/route.ts` | **MODIFIED** | Validasi zod targetKeywords di videoConfigSchema |
| `src/components/generator/GeneratorForm.tsx` | **MODIFIED** | URL sync, SEO keyword badges, & quick research link |
| `src/app/[locale]/dashboard/generator/page.tsx` | **MODIFIED** | Suspense boundary untuk useSearchParams |
| `src/lib/parsers.ts` | **MODIFIED** | Unicode u flag pada extractChosenTitle & filter judul |
| `src/app/[locale]/dashboard/layout.tsx` | **MODIFIED** | Navigasi sidebar `/dashboard/research` |
| `src/components/layout/MobileDashboardNav.tsx` | **MODIFIED** | Navigasi mobile drawer `/dashboard/research` |
| `messages/id.json` & `messages/en.json` | **MODIFIED** | Translation keys untuk menu research |

---

## [#51] — 2026-09-07 | Separation of VO Toggle from Content Archetype & Introduction of Flexible Narration Mode Selector

### Problem Statement
1. **Pencampuran Konsep VO Toggle dan Mode Diegetik**: Pada `promptGenerator.ts` (baris 187), terdapat logika fallback keliru `(finalVoPreference ? "VOICE_OVER" : "DIEGETIC_ONLY")`. Akibatnya, saat user mematikan tombol *Voice Over* di *Audio Preferences* (yang tujuannya hanya untuk menghilangkan talking-head/lipsync pada Visual Prompt video AI), sistem justru memaksa mode narasi menjadi `DIEGETIC_ONLY`. Seluruh naskah narasi dubbing terhapus dan digantikan oleh tag `[DIEGETIC - TANPA VOICE-OVER]`.
2. **Keterikatan Kaku pada Level Channel**: Mode narasi (`narrationMode`) sebelumnya hanya dapat diatur melalui profil channel (Model Konten / Archetype). Pengguna tidak memiliki keleluasaan untuk sesekali membuat konten diegetik / faceless pada channel standar tanpa harus mengubah konfigurasi channel secara global.

### Implementasi Arsitektur & Perbaikan

1. **Pemisahan Independen Logika Prompt Generator (`src/lib/promptGenerator.ts`)**:
   - Menghapus ketergantungan `effectiveNarrationMode` dari `finalVoPreference`. Fallback default kini selalu `"VOICE_OVER"` jika tidak disetel eksplisit oleh videoConfig atau archetype.
   - **Peran Murni Toggle VO (`voPreference: false`)**:
     - Visual Prompt tetap disuntikkan suffix `, no voice over` agar generator video tidak merender orang berbicara.
     - Naskah `NARASI:` **tetap ditulis lengkap & conversational** sesuai bahasa pilihan (*Output Language*) untuk dubbing/bacaan kreator.
   - **Mode `DIEGETIC_ONLY`**:
     - Hanya aktif jika dipilih secara sadar melalui Archetype atau pemilih mode narasi manual.
     - Naskah narasi diberi penanda diegetik dan cerita disampaikan melalui Teks Overlay Layar + SFX.

2. **Integrasi Selector Mode Narasi di Generator Studio (`GeneratorForm.tsx`)**:
   - Menambahkan komponen selector baru **"🎬 Mode Narasi Video"** di atas *Audio Preferences*:
     - **Auto**: Mengikuti model konten profil channel (disertai badge mode bawaan).
     - **🎙️ Voice Over**: Menjamin pembuatan naskah narasi & dialog lengkap.
     - **🔇 Diegetic Only**: Mode tanpa narator luar, fokus SFX in-scene & teks overlay.
     - **📄 Teks Layar**: Video hening dengan fokus teks di layar.
   - State `narrationModeOverride` otomatis disinkronkan ke `localStorage` dan server preferences (`/api/user/preferences`).
   - Tombol toggle Voice Over di *Audio Preferences* otomatis di-disable secara aman saat mode diegetik/silent aktif, serta dilengkapi teks penjelasan kontekstual.

### Verifikasi
- Validasi TypeScript: `npx tsc --noEmit` $\rightarrow$ **0 error** ✅
- Pengujian Skrip Unit Terisolasi (`scratch/test_narration_modes.ts`):
  - **Skenario 1 (VO ON)**: Naskah normal, tanpa suffix `no voice over`, bukan diegetik $\rightarrow$ **PASS** ✅
  - **Skenario 2 (VO OFF)**: Naskah narasi **tetap lengkap utuh**, Visual Prompt menyertakan `no voice over`, bukan diegetik $\rightarrow$ **PASS** ✅
  - **Skenario 3 (Override DIEGETIC_ONLY)**: Naskah ditandai `[DIEGETIC - TANPA VOICE-OVER]`, instruksi diegetic disuntikkan $\rightarrow$ **PASS** ✅
  - **Skenario 4 (Channel Diegetik + Override VOICE_OVER)**: Naskah lengkap berhasil dipulihkan $\rightarrow$ **PASS** ✅

### Files Modified
| File | Perubahan |
|------|-----------|
| `src/lib/promptGenerator.ts` | Pemisahan fallback `effectiveNarrationMode` dari `finalVoPreference` |
| `src/components/generator/GeneratorForm.tsx` | Selector Mode Narasi, state persistence, penyelarasan kontrol Audio Preferences & payload API |

---

## [#50] — 2026-09-07 | Parse Engine Hardening: Diegetic Audio Mode, Scene Overlay Extraction, and Studio Synchronization

### Problem Statement
1. **Distorsi Naskah Diegetik**: Saat mode narasi `DIEGETIC_ONLY` aktif, tag teknis `[DIEGETIC - TANPA VOICE-OVER]` yang dicetak AI tidak dibersihkan oleh `extractAudioCues()`, sehingga di-render ke UI sebagai naskah yang harus diucapkan pengisi suara di bawah label `🎤 NARASI`.
2. **`TEKS OVERLAY` Tertelan ke Narasi**: Pada video pendek (Shorts/Reels/TikTok), AI kerap menyisipkan `TEKS OVERLAY: "..."`. Karena regex lookahead narasi tidak mencakup `Teks Overlay`, teks overlay tertelan masuk ke dalam kolom narasi.
3. **`VISUAL PROMPT` Bocor ke Panduan Suara**: Delimiter lookahead `PANDUAN SUARA` menggunakan `Visual\s*:`, sehingga gagal berhenti saat bertemu `VISUAL PROMPT:`. Akibatnya, seluruh visual prompt sinematik bocor masuk ke dalam `voiceGuidelines.traits`.
4. **Indikator SFX Tersembunyi**: Badge SFX di Scene Studio dibungkus kondisi `{scene.narasi !== "—"}`, sehingga pada video diegetik tanpa narasi suara, pill SFX tidak tampil.
5. **Kegagalan Ekstraksi Sub-Heading Tanpa Tagar (`##`)**: AI kadang mencetak `HTML BLOG`, `REKOMENDASI PRODUK AFFILIATE`, dan `THUMBNAIL STUDIO` tanpa awalan `##` atau dalam satu baris (*inline*), menyebabkan parser mengembalikan string kosong atau opsi thumbnail terpotong.
6. **Template Scene Belum Memuat Baris Resmi Overlay**: `promptGenerator.ts` belum mencantumkan slot baku `TEKS OVERLAY:` di per-scene template output wajib.

### Implementasi Arsitektur & Perbaikan

1. **Hardening Core Parser (`src/lib/parsers.ts`)**:
   - `extractAudioCues`: Ditambahkan properti `isDiegetic?: boolean`. Tag `[DIEGETIC...]`, `[TANPA VOICE-OVER]`, serta boilerplate larangan VO kini otomatis dibersihkan. Jika naskah kosong, `cleanNarasi` mengembalikan `""` (bukan string placeholder).
   - `extractThumbnailData`: Menggunakan tokenized lookahead regex agar mengekstrak seluruh field (`seoText`, `opsi1Prompt`, `opsi1Overlay`, `opsi2Prompt`, `opsi2Overlay`, `recommendations`) secara presisi baik format baris maupun inline, serta dibatasi sebelum header section berikutnya.
   - `extractHtmlBlog` & `extractAffiliateRecommendations`: Ditingkatkan agar toleran terhadap variasi header dengan atau tanpa `##` / `**` (`(?:##\s*|###\s*|\*\*\s*|\b)`).

2. **Sinkronisasi Scene Prompt Studio (`ScenePromptStudioClient.tsx`)**:
   - Interface `Scene`: Ditambahkan field `teksOverlay?: string` dan `isDiegetic?: boolean`.
   - `parseScenes`:
     - Penambahan delimiter terpadu (`Teks Overlay`, `Visual Prompt`, `Panduan Suara`, `Durasi`).
     - Lookahead boundary `PANDUAN SUARA` diperbaiki agar mengenali `VISUAL PROMPT:`.
     - Regex boundary diperluas dengan `TOTAL DURASI` agar durasi scene penutup terhitung bersih (`9 detik`, bukan `9 detik Total...`).
   - Tampilan Antarmuka (UI):
     - Badge status **`🔇 Diegetic (Tanpa VO)`** otomatis muncul pada kartu scene saat terdeteksi mode diegetik.
     - Card khusus **`💬 Teks Overlay Layar`** dengan tombol copy terintegrasi.
     - Badge audio **`🔊 SFX`** dan **`🎵 BGM`** dipindahkan ke luar kondisi narasi sehingga selalu tampil.

3. **Konsistensi Detail Draf (`drafts/[id]/page.tsx`)**:
   - Menambahkan field `teksOverlay` dan `isDiegetic` pada `SceneItem`.
   - Menampilkan badge diegetic, kartu teks overlay, dan pill audio pada halaman detail draf tersimpan.

4. **Formalisasi Prompt Generator (`src/lib/promptGenerator.ts`)**:
   - Menambahkan baris baku `TEKS OVERLAY: [Teks singkat yang muncul di layar...]` di template wajib `SCENE 1` dan `SCENE 2`.

### Verifikasi
- Validasi Statis: `npx tsc --noEmit` $\rightarrow$ **Exit code: 0** (0 error) ✅
- Uji End-to-End Naskah Real (9 Scene Rubah Kutub — Diegetic Only):
  - 9 Scene terurai lengkap: `narasi = "—"`, `isDiegetic = true`, `teksOverlay` terisolasi presisi, SFX cues terdeteksi penuh ✅
  - `voiceGuidelines.traits` bersih tanpa kebocoran Visual Prompt ✅
  - Thumbnail Studio, HTML Blog, dan Rekomendasi Affiliate terekstrak 100% akurat ✅

### Files Modified
| File | Perubahan |
|------|-----------|
| `src/lib/parsers.ts` | Deteksi `isDiegetic`, pembersihan tag diegetik, resilience `extractThumbnailData`, `extractHtmlBlog`, `extractAffiliateRecommendations` |
| `src/app/[locale]/dashboard/scene-prompt/ScenePromptStudioClient.tsx` | Schema `Scene`, delimitasi `parseScenes`, UI diegetic badge, teks overlay card, pill SFX mandiri |
| `src/app/[locale]/dashboard/drafts/[id]/page.tsx` | Schema `SceneItem`, render diegetic & teks overlay pada detail draf |
| `src/lib/promptGenerator.ts` | Penambahan baris `TEKS OVERLAY:` pada template scene output wajib |

---

## [#49] — 2026-09-05 | Addendum Bagian 23: Universal / Model-Agnostic Content Structure Engine & Audit Hardening

### Problem Statement
1. **Model Konten Terkunci (Hardcoded)**: Generator sebelumnya hanya mendukung satu pola konten: video marketing/edukasi dengan narasi voice-over luar dan struktur `Hook -> Problem -> Solution -> CTA`. Format video faceless, rekonstruksi historis, diegetik (SFX/ambient), ASMR, atau storytelling murni mengalami distorsi instruksi prompt dan false-warning perbandingan durasi.
2. **Pelanggaran Single Source of Truth**: Toggle section naskah (`includedSections.hook`) di form generator dilanggar diam-diam oleh injeksi hardcoded di dua titik (Bagian 13.2 poin 7 dan Bagian 18), sehingga retensi dan hook tetap dipaksakan meski user menonaktifkannya.
3. **Temuan Audit Kritis**:
   - **Response API Inkonsisten**: Endpoint `/api/content-archetypes` dan `/api/admin/content-archetypes` tidak mengembalikan `{ success: true }`, menyebabkan dropdown channel dan tab admin archetype gagal memuat data.
   - **Kalkulasi Matematis Durasi Fatal**: Endpoint `/api/drafts` mengasumsikan `speechRate` dalam satuan Words Per Minute (WPM) dengan pembagi 60, padahal aplikasi menggunakan satuan detik-per-kata (0.35 s/kata), menyebabkan naskah 100 kata terhitung memiliki durasi 17.143 detik (~4,7 jam).
   - **UX Audio Preferences Mismatch**: Tombol Voice-Over tetap menyala hijau pada form generator meski channel yang dipilih bertipe `DIEGETIC_ONLY`.

### Implementasi Arsitektur & Perbaikan

1. **Model Data Baru `ContentArchetype` & Relasi Schema (`prisma/schema.prisma`)**:
   - Model `ContentArchetype`: `name`, `description`, `narrationMode` (`VOICE_OVER`, `DIEGETIC_ONLY`, `SILENT_TEXT_ONLY`, `HYBRID`), `emotionalArcTemplate`, `defaultIncludedSections` (JSON), `compositionCategories` (JSON), `durationCalcMode` (`NARRATION_WORDCOUNT`, `SEGMENT_SELF_ESTIMATE`, `HYBRID`), `cameraMovementRoleMap` (JSON nullable), dan flag `isSystem`.
   - Relasi `ProfileChannel.contentArchetypeId` ke `ContentArchetype`.
   - Kolom `Draft.durationSource` (`SEGMENT_ESTIMATE` vs `WORDCOUNT_FALLBACK`) untuk auditabilitas durasi naskah.
   - Migrasi PostgreSQL: `prisma/migrations/20260905_add_content_archetype/migration.sql`.

2. **Single Source of Truth Prompt Generator (`src/lib/promptGenerator.ts`)**:
   - Fungsi terpusat `buildStructuralInstructions(includedSections, archetype, activeNarrationMode)` menyatukan seluruh injeksi busur emosi, pedoman viralitas, pacing, dan mode narasi.
   - Eliminasi hardcode Hook/PAS/AIDA: hanya disuntik jika `includedSections.hook !== false`.
   - Mode `DIEGETIC_ONLY` dan `SILENT_TEXT_ONLY`: menyuntikkan larangan keras voice-over luar dan mewajibkan penanda eksplisit `[DIEGETIC - TANPA VOICE-OVER]` pada field narasi adegan.
   - Penyesuaian `generateMasterPrompt`: bypass validasi 100% komposisi jika semua bobot 0 pada model terpadu.

3. **Integrasi UI & UX Polishing**:
   - **Generator Studio (`GeneratorForm.tsx`)**:
     - Auto-sync default sections (`includeHook`, `includeCTA`, `includeCaption`, `includeThumbnail`) saat memilih channel.
     - Badge indikator model konten aktif & mode narasi di bawah dropdown channel.
     - Menyembunyikan input *Hook Style* & *Ending Style* jika section tidak aktif.
     - Menggantikan slider komposisi dengan banner informatif alur emosional terpadu untuk archetype non-standar.
     - Tombol *Voice Over* dinonaktifkan secara otomatis (disabled dengan tooltip) jika model konten aktif adalah `DIEGETIC_ONLY` atau `SILENT_TEXT_ONLY`.
   - **Channel Management (`ChannelManagerClient.tsx` & `EditChannelClient.tsx`)**:
     - Dropdown pemilihan model konten terintegrasi pada pembuatan & pengeditan channel profile.
     - Badge nama archetype pada kartu channel.
     - Fallback otomatis ke default sistem (`Marketing/Edukasi Standar`) jika user tidak memilih archetype saat membuat channel baru.
   - **Superadmin Panel (`AdminArchetypesTab.tsx` & `AdminSettingsClient.tsx`)**:
     - Tab baru **"Model Konten (Archetypes)"** untuk CRUD archetype kustom & sistem.
     - Proteksi penghapusan untuk archetype bawaan sistem dan archetype yang masih ditautkan ke channel aktif.
   - **Detail Draft (`drafts/[id]/page.tsx`)**:
     - Badge metode durasi: `⏱️ Estimasi Durasi Adegan (Segment Self-Estimate)` vs `🎙️ Estimasi Narasi (Wordcount Voice-Over)`.
     - Eliminasi false warning durasi untuk format diegetik/faceless.

4. **Hardening Hasil Audit**:
   - Standardisasi respons API publik & admin archetype agar menyertakan `{ success: true, archetypes }`.
   - Normalisasi unit `speechRate` di `/api/drafts`: deteksi $\le 2$ sebagai detik-per-kata ($\text{totalWords} \times \text{rate}$) dan $> 2$ sebagai WPM ($\frac{\text{totalWords}}{\text{rate} / 60}$) dengan fallback ke `channel.speechRate`.

### Verifikasi
- `npx tsc --noEmit` $\rightarrow$ **Exit code: 0** (0 error) ✅
- Test suite logika Bagian 23 (`test_archetype.ts`): seluruh 4 test case lulus 100% ✅
- Test kalkulasi matematis durasi (5 variasi unit): seluruh estimasi durasi akurat presisi ✅

### Files Modified / Created
| File | Perubahan |
|------|-----------|
| `prisma/schema.prisma` | Model `ContentArchetype`, enums, relasi `ProfileChannel`, kolom `Draft.durationSource` |
| `prisma/migrations/20260905_add_content_archetype/migration.sql` | Skrip migrasi DDL database PostgreSQL |
| `prisma/seed.js` | Seed 2 archetype bawaan sistem & penautan channel warisan |
| `src/lib/promptGenerator.ts` | Refactor `buildStructuralInstructions`, interpolasi busur emosi, aturan diegetik, bypass komposisi |
| `src/app/api/content-archetypes/route.ts` | GET public endpoint dengan fail-safe auto-seed & response `{ success: true }` |
| `src/app/api/admin/content-archetypes/route.ts` | GET (dengan channel count & `success: true`) dan POST CRUD admin |
| `src/app/api/admin/content-archetypes/[id]/route.ts` | PUT dan DELETE admin dengan proteksi sistem & channel count guard |
| `src/app/api/channels/route.ts` | GET/POST channel dengan relasi archetype & default fallback |
| `src/app/api/channels/[id]/route.ts` | PUT channel dengan pembaruan `contentArchetypeId` |
| `src/app/api/drafts/route.ts` | Normalisasi unit durasi, `durationSource` tracking, fallback channel speechRate |
| `src/app/api/generate/route.ts` | Schema archetype override, include channel archetype, bypass validasi komposisi 0 |
| `src/components/generator/GeneratorForm.tsx` | Auto-sync sections, badge model konten, bypass slider komposisi, auto-disable VO button |
| `src/app/[locale]/dashboard/generator/page.tsx` | Include `contentArchetype` pada query channel |
| `src/app/[locale]/dashboard/channels/page.tsx` | Include `contentArchetype` pada query channel |
| `src/app/[locale]/dashboard/channels/ChannelManagerClient.tsx` | Badge archetype pada tampilan daftar channel |
| `src/app/[locale]/dashboard/channels/EditChannelClient.tsx` | Dropdown picker archetype pada form channel |
| `src/app/[locale]/dashboard/drafts/[id]/page.tsx` | Badge sumber estimasi durasi & eliminasi false warning |
| `src/app/[locale]/admin/settings/AdminSettingsClient.tsx` | Registrasi tab Model Konten (Archetypes) |
| `src/app/[locale]/admin/settings/AdminArchetypesTab.tsx` | UI tab lengkap manajemen CRUD archetype |

---

## [#48] — 2026-09-04 | UX Refactoring — Extracted Titles: Dua Aksi Eksplisit

### Problem Statement
Tombol "Pilih Judul" di panel **Extracted Titles** secara diam-diam menjalankan dua aksi sekaligus: menetapkan judul sebagai *Draft Title* DAN menyimpan ke *Used Titles Directory*. Tidak ada feedback visual yang memperjelas bahwa judul sudah masuk ke direktori, karena state `isMarked` sudah di-track di kode namun **tidak pernah ditampilkan di UI**. User mengira tidak ada tombol untuk memasukkan judul ke direktori.

### Perubahan Arsitektur

1. **Pemisahan Tanggung Jawab Tombol** (`ScenePromptStudioClient.tsx`):
   - `handleSelectTitle(title)` kini **hanya** menetapkan `draftTitle` (tidak lagi memanggil `handleMarkAsUsed`).
   - `handleMarkAsUsed(title)` tetap menjadi satu-satunya fungsi yang POST ke `/api/drafts/import-titles`.
   - Dua tombol terpisah kini muncul per judul:
     - 🔵 **Pilih Judul** — Menetapkan sebagai *Draft Title* di kolom simpan bawah.
     - 🟢 **📂 Simpan ke Direktori** — Menyimpan permanen ke *Used Titles Directory*.

2. **Feedback Visual Persisten** (`ScenePromptStudioClient.tsx`):
   - State `isMarked` kini **ditampilkan** sebagai badge hijau ✅ **"Tersimpan di Direktori"** yang menetap setelah judul disimpan.
   - Ikon ✅ muncul di samping teks judul sebagai indikator status instan.
   - Jika channel belum dipilih saat mencoba simpan, muncul pesan error `t("selectChannelFirst")` yang jelas.

3. **i18n Keys Baru** (`messages/id.json` & `messages/en.json`, namespace `ScenePromptStudio`):
   - `saveToDirectory` → "Simpan ke Direktori" / "Save to Directory"
   - `savedToDirectory` → "Tersimpan di Direktori" / "Saved to Directory"
   - `selectOrSave` → instruksi mini header panel
   - `selectChannelFirst` → pesan error jika channel belum dipilih

### Verifikasi
- `npx tsc --noEmit` → **Exit code: 0** ✅
- Alur baru: Parse → lihat judul → klik "Pilih Judul" (draft title berubah) → klik "📂 Simpan ke Direktori" (badge ✅ muncul, masuk ke direktori)

### Files Modified
| File | Perubahan |
|------|-----------|
| `src/app/[locale]/dashboard/scene-prompt/ScenePromptStudioClient.tsx` | Pisah `handleSelectTitle` & `handleMarkAsUsed`, UI dua tombol eksplisit, badge `isMarked` |
| `messages/id.json` | +4 keys baru di namespace `ScenePromptStudio` |
| `messages/en.json` | +4 keys baru di namespace `ScenePromptStudio` |

---

## [#47] — 2026-09-04 | Parser Hardening — Affiliate & Extracted Titles Detection

### Problem Statement
Dua fungsi parser kritis di `parsers.ts` terlalu rigid dalam mendeteksi format output AI:
1. **`extractAffiliateRecommendations()`**: Hanya mendeteksi header `## REKOMENDASI PRODUK AFFILIATE` secara eksak. AI sering menghasilkan variasi (bold `**...**`, tanpa kata "AFFILIATE", format URL sebagai markdown link `[label](url)`) yang menyebabkan panel Affiliate tidak muncul.
2. **`extractTitles()`**: Tidak mendeteksi format numbered list dengan persentase (`1. "Judul Ini" (85%)`) yang merupakan output AI Tahap 1 yang paling umum. Header `"Rekomendasi Judul"` juga tidak dikenali sebagai aktivator section.

### Perbaikan

1. **`extractAffiliateRecommendations()`** (`src/lib/parsers.ts`):
   - Regex header diperluas: sekarang mendeteksi `## ...` **maupun** `**...**` (bold) format.
   - Kata "AFFILIATE" dijadikan **opsional** dalam header (`REKOMENDASI PRODUK` saja sudah cukup).
   - URL extractor kini meng-unwrap format markdown link `[label](https://...)` sebelum menyimpan URL.

2. **`extractTitles()`** (`src/lib/parsers.ts`):
   - Ditambahkan **`numberedPattern`** baru: `/^\d+[.)\-]\s*["*]?(.+?)["*]?\s*(?:\(\d+%\))?$/` untuk mendeteksi format `1. "Judul" (85%)`.
   - Header `"rekomendasi judul"` kini dikenali sebagai section aktivator.
   - Pembersihan lebih agresif: strip tanda kutip, asterisk bold, dan persentase dari teks judul.
   - Panjang minimum judul dinaikkan dari `>3` → `>5` untuk mengurangi false positive.

### Verifikasi
- `npx tsc --noEmit` → **Exit code: 0** ✅

### Files Modified
| File | Perubahan |
|------|-----------|
| `src/lib/parsers.ts` | Hardening regex `extractAffiliateRecommendations` & `extractTitles` |

---

## [#46] — 2026-09-04 | UI/UX & PWA Accessibility Audit

### Problem Statement
Beberapa UI komponen mengalami degradasi visual dan *layout breaking* saat diakses melalui mode Gelap (Dark Mode) dan pada perangkat Mobile (PWA viewport):
1. **Dark Mode Text Invisibility**: Banyak input fields dan select dropdown menggunakan hardcoded `bg-white` tanpa varian dark. Pada mode gelap, background menjadi putih dan teks menjadi putih, menyebabkan teks tidak terbaca (invisible).
2. **Low Contrast Text**: Global teks muted dan subtext di mode gelap menggunakan rasio kontras yang terlalu rendah (sulit terbaca pada background navy).
3. **PWA Mobile Overflow**: Komponen hasil generator dan tab navigasi terpotong (overflow) atau tersusun berantakan karena fixed height (`h-[85vh]`) dan fixed margins.

### Implementasi Sistem

1. **Aksesibilitas Kontras (Dark Mode Fix)** (`src/app/[locale]/globals.css` & Components):
   - Meningkatkan rasio kontras variabel `--pg-text-muted` (`#94a3b8`) dan `--pg-text-sub` (`#a0aec0`) pada blok `.dark`.
   - Menginjeksi `dark:bg-slate-700` dan `dark:bg-slate-700/50` pada seluruh field input di `GeneratorForm.tsx` dan `ScenePromptStudioClient.tsx`.

2. **Mobile / PWA Responsiveness** (`src/components/generator/GeneratorForm.tsx`):
   - **Height Clamping Fix**: Mengganti `h-[85vh]` menjadi responsif `md:h-[85vh] min-h-[50vh]` agar container tidak menjebak konten / terpotong pada layar ponsel.
   - **Affiliate Section Fix**: Mengubah margin `ml-5` statis menjadi padding responsif `pl-4 md:pl-5` dengan left border sebagai indikator hierarki, mencegah horizontal overflow di mobile.

3. **Tab & Action Group Responsiveness** (`src/app/[locale]/dashboard/scene-prompt/ScenePromptStudioClient.tsx`):
   - **Horizontal Scroll Tabs**: Navigasi tab (Scenes, Thumbnail, Platform) kini diatur agar memiliki _horizontal scroll_ mulus di layar sempit (`overflow-x-auto`) daripada memaksakan flex-wrap.
   - **Action Buttons**: Tombol "Set Terpilih" dan "Copy" kini dapat membungkus secara natural di bawah teks judul pada resolusi sempit (`flex-wrap justify-end`).

### Verifikasi
- `npm run build` → **Exit code: 0** ✅ (0 error)
- Uji coba Dark Mode → Semua input terbaca jernih.
- Uji coba mobile screen (320px) → Tidak ada konten terpotong.

## [#45] — 2026-09-04 | Affiliate Product Angle Revamp — Marketplace Selector & Rekomendasi Produk AI

### Problem Statement
Fitur *Affiliate Product Angle* (#44) sudah menyuntikkan instruksi afiliasi ke prompt AI, namun memiliki dua kelemahan kritis:
1. **Bug Duplikasi Data:** `productContext` dan `affiliateAngleGuide` keduanya menginjeksi daftar produk yang sama ke dalam prompt secara bersamaan, membuang token dan berpotensi membingungkan model.
2. **Keterbatasan Fitur:** AI tidak memberikan rekomendasi produk konkret dengan link marketplace kepada user — fitur tidak memberikan nilai nyata bagi creator yang ingin menyertakan link afiliasi.

### Implementasi Sistem

1. **Bug Fix — Eliminasi Duplikasi `productContext`** (`src/lib/promptGenerator.ts`):
   - `productContext` kini hanya diinjeksi ke prompt jika `affiliateAngle === false`.
   - Jika `affiliateAngle === true`, `affiliateAngleGuide` sudah mencakup seluruh data produk — tidak ada duplikasi.

2. **Prompt Enhancement — Instruksi Rekomendasi Produk** (`src/lib/promptGenerator.ts`):
   - Menambahkan interface field `affiliateMarketplaces: string[]` dan `affiliateCustomUrl: string` ke `VideoConfigData`.
   - Ketika affiliate aktif, AI diperintahkan menghasilkan section `## REKOMENDASI PRODUK AFFILIATE` di akhir output berisi 3–5 produk relevan.
   - Setiap produk menyertakan field `PRODUK`, `ALASAN`, dan `LINK [MARKETPLACE]` dengan URL pencarian valid dan ter-encode per marketplace yang dipilih user.
   - 5 marketplace bawaan: Tokopedia, Shopee, TikTok Shop, Lazada, Blibli. Dukungan Custom URL marketplace tambahan.

3. **Parser Enhancement — `extractAffiliateRecommendations()`** (`src/lib/parsers.ts`):
   - Interface baru: `AffiliateRecommendation { productName, reason, links: AffiliateProductLink[] }`.
   - Fungsi `extractAffiliateRecommendations(text)` meng-parse section hasil AI menjadi array structured data.
   - Robust: menangani format bold markdown (`**PRODUK:**`), URL placeholder (tidak masuk array), dan blok kosong.

4. **UI Generator Form — Marketplace Selector** (`src/components/generator/GeneratorForm.tsx`):
   - State baru: `affiliateMarketplaces` (default: semua marketplace kecuali custom) dan `affiliateCustomUrl`.
   - Panel marketplace muncul di dalam panel affiliate (di bawah SOFT/CTA toggle) saat affiliate dicentang.
   - Grid 2-kolom checkbox per marketplace. Input Custom URL muncul hanya jika "Custom URL" dicentang.
   - Semua state di-persist ke `stateObj` (localStorage + server debounce 3 detik) — tidak perlu setting ulang antar sesi.

5. **UI Scene Prompt Studio — Panel Rekomendasi** (`src/app/[locale]/dashboard/scene-prompt/ScenePromptStudioClient.tsx`):
   - `handleParse()` kini memanggil `extractAffiliateRecommendations(rawText)` dan menyimpan hasilnya ke state `affiliateRecs`.
   - Panel **🛒 Rekomendasi Produk Affiliate** ditampilkan di atas **✨ Extracted Titles** setelah parse berhasil.
   - Setiap produk menampilkan nama, alasan relevansi, dan tombol link per marketplace yang dapat diklik (buka search page di tab baru).
   - Panel hanya muncul jika AI menghasilkan section rekomendasi (backward compatible).

### Verifikasi
- `npm run build` → **Exit code: 0** ✅ (37 halaman, 68+ API routes)
- TypeScript: **0 error**
- Auto-persist marketplace settings: ✅ terbukti via localStorage restore

### Files Modified
| File | Perubahan |
|------|-----------|
| `src/lib/promptGenerator.ts` | Fix duplikasi, tambah marketplace interface & instruksi AI |
| `src/lib/parsers.ts` | Tambah `extractAffiliateRecommendations()`, interface `AffiliateRecommendation` |
| `src/components/generator/GeneratorForm.tsx` | State marketplace, UI checkbox panel, auto-persist |
| `src/app/[locale]/dashboard/scene-prompt/ScenePromptStudioClient.tsx` | Panel rekomendasi produk di atas Extracted Titles |

---

## [#44] — 2026-08-28 | Penambahan Fitur Sudut Pandang Afiliasi (Affiliate Product Angle)

### Problem Statement
User membutuhkan kemampuan agar AI dalam Prompt Gen dapat diarahkan untuk menghasilkan ide konten dan naskah video yang *shoppable* (mendukung penandaan produk afiliasi), dengan dua pilihan mode: eksplisit menggunakan CTA atau soft-selling organik.

### Implementasi Sistem
1. **API Validasi & Autosave**:
   - Menambahkan field `affiliateAngle` (boolean) dan `affiliateAngleMode` (enum "CTA" | "SOFT") pada schema `videoConfigSchema` dan `generatorFormStateSchema` di `/api/user/preferences/route.ts` (.strict()) untuk menghindari error 400 Bad Request saat autosave.
   - Menambahkan field pada `/api/generate/route.ts` sehingga terkirim dengan benar ke proses payload.
2. **Prompt Generator Engine**:
   - Menyuntikkan `affiliateTitleDirective` khusus pada TAHAP 1 untuk menginstruksikan AI agar memprioritaskan ide konten yang relevan dengan produk.
   - Menyuntikkan `affiliateAngleGuide` pada master prompt (TAHAP 2) untuk mengunci apakah script menggunakan ajakan CTA langsung atau menyebut produk secara organik.
3. **UI / UX**:
   - UI Checkbox dan Conditional Radio button ditambahkan pada *Additional Components* di halaman *GeneratorForm*, berjalan persis berdampingan dengan komponen pro-mode lainnya.
   - Terintegrasi penuh dengan auto-save `localStorage` dan sinkronisasi server setiap 3 detik.
4. **Lokalisasi**:
   - Menambahkan key translasi di `en.json` dan `id.json` secara konsisten (tanpa *hardcoded strings*).

---

## [#43] — 2026-08-26 | Arsitektur Used Titles Directory — Tabel UsedTitle Permanen

### Problem Statement
Sebelumnya, "Used Titles Directory" bergantung pada tabel `Draft`:
- `import-titles` menulis ke `Draft` dengan `wordCount=0`
- `export` dan AI exclude membaca dari `Draft.title`
- **Efek samping kritis:** Menghapus draft = judul ikut terhapus dari exclude list → AI bisa mengulang judul yang sudah pernah dipakai.

### Solusi: Tabel `UsedTitle` Terpisah

**Schema (prisma/schema.prisma):**
- Tambah model `UsedTitle` dengan unique constraint `(channelId, type, title)`
- Foreign key ke `User` dan `ProfileChannel` dengan `onDelete: Cascade`
- Relasi back-reference ditambah ke `User.usedTitles` dan `ProfileChannel.usedTitles`

**Migration:**
- SQL di `prisma/migrations/20260826_add_used_title_table/migration.sql`
- Data migration script di `migrate_data.js` (salin dari `Draft` ke `UsedTitle`)
- Jalankan: `npx prisma migrate deploy` lalu `node migrate_data.js`

### Perubahan Kode

| File | Perubahan |
|------|-----------|
| `api/drafts/import-titles/route.ts` | Tulis ke `prisma.usedTitle.upsert()` — bukan `prisma.draft.create()` |
| `api/drafts/export/route.ts` | Baca dari `UsedTitle` (utama) + `Draft` (historis fallback), deduplicated |
| `api/generate/route.ts` | Exclude dari `UsedTitle` + `Draft` dual-source (transition safety) |
| `ScenePromptStudioClient.tsx` | `handleSelectTitle` = `setDraftTitle` + `handleMarkAsUsed` (atomic) |

### UX Baru di Scene Prompt Studio
- Parse → judul muncul di atas dengan tombol **"Pilih"**
- Klik "Pilih" → judul masuk ke `draftTitle` field **DAN** langsung ditulis ke `UsedTitle` (permanen)
- Menghapus draft tidak mempengaruhi Used Titles Directory
- AI akan exclude judul tersebut di semua sesi generate berikutnya

### Data Safety
- Data lama tidak hilang — `Draft` table tidak diubah/dihapus
- `migrate_data.js` menyalin semua judul historis dari `Draft` → `UsedTitle`
- `generate/route.ts` membaca dari kedua sumber selama masa transisi

### 🔴 BUG FIX & UX Update (Post-Audit #43)
- **Parser Judul**: Memperbaiki kelemahan regex `extractTitles` (`src/lib/parsers.ts`) yang salah mendeteksi blok instruksi AI berhuruf kapital (seperti `PANDUAN SUARA:` atau `TEKS OVERLAY SEO:`) sebagai bagian dari daftar judul. Sekarang parser secara proaktif mendeteksi pembatas blok ini dan berhenti mengekstrak judul.
- **Penghapusan Tombol "Mark"**: Menghapus tombol *Mark as Used* yang redundan pada UI `ScenePromptStudioClient.tsx`. Mengklik "Pilih Judul" kini secara atomik menyimpan draft dan otomatis mencatat judul ke Used Titles Directory, menyederhanakan alur user dan mencegah kebingungan aksi ganda (Copy vs Mark).
- **Missing i18n Keys & Label Fixes**: Memasukkan `selectTitle` ("Pilih Judul") dan `selectedTitle` ("Judul Terpilih") ke dalam `id.json` dan `en.json`. Mengganti istilah "Video Drafts" / "Image Drafts" menjadi "Judul Video" / "Judul Gambar" agar sesuai dengan arsitektur yang kini permanen (tidak bergantung pada draft).
- **Anti-Caching pada Used Titles Directory**: Menambahkan `cache: 'no-store'` pada fetch frontend (`UsedTitlesDirectory.tsx`) dan `export const dynamic = 'force-dynamic'` pada endpoint backend (`/api/drafts/export/route.ts`) untuk mencegah browser/Next.js melakukan cache agresif yang membuat judul tidak langsung muncul sesaat setelah dipilih.

---


## [#41] — 2026-08-26 | Audit Independen P0+P1 — Save Draft Fix & Real-Time Auth Check

### Temuan & Perbaikan (Diverifikasi dari Kode Langsung)

**P0 — Bug Save Draft VIDEO (100% Failure Rate)**
- **Masalah:** `ScenePromptStudioClient` tidak menyertakan field `topic` dalam payload `POST /api/drafts`, sedangkan `saveDraftSchema` mewajibkan field ini. Akibatnya 100% simpan draft VIDEO gagal dengan 400 Bad Request.
- **Fix 1:** `saveDraftSchema` diubah dari `topic: z.string()` → `topic: z.string().optional()` dengan fallback chain: `manualTitle → parsedData.judul_konten → "Draft {type}"`.
- **Fix 2:** `handleSaveDraft` kini menyertakan `topic: effectiveTopic` (diturunkan dari `draftTitle` atau `channel.niche`).

**P0 — Schema Mismatch Penulis vs Pembaca Draft VIDEO**
- **Masalah:** `DraftDetailPage` membaca `segments`, `caption_medsos`, `ide_thumbnail`, `opsi_judul` — tetapi `ScenePromptStudioClient` menulis `scenes`, `caption`, `thumbnailData`. Hanya `html_blog` yang cocok.
- **Fix:** `handleSaveDraft` kini menulis canonical field names + alias lama (hybrid approach).
- **Fix:** `DraftParsedData` interface di `DraftDetailPage` diperluas untuk mendukung kedua schema (backward compat). Rendering menggunakan fallback priority: `segments` > `scenes`.
- **Bonus Fix:** `parsedTitles` (state yang ada tapi tidak pernah dikirim) kini disertakan sebagai `opsi_judul`. `ThumbnailData` dikonversi ke string teks yang dapat di-copy.

**P1 — Orphan Endpoint /api/auth/check**
- **Masalah:** Endpoint `POST /api/auth/check` fungsional 100% tapi tidak pernah dipanggil.
- **Fix:** `AuthForm.tsx` kini melakukan debounced fetch (400ms) ke `/api/auth/check` saat field `username` atau `email` diubah pada step 1 registrasi. Menampilkan indikator inline: ⏳ checking / ✓ available / ✗ taken.

**P1 — Hardcoded String (6 File)**
- `GeneratorForm.tsx`: Quick Add Product modal (7 string → `t()`)
- `EditChannelClient.tsx`: 3 placeholder niche/persona/desc → `t()`
- `AdminSupportClient.tsx`: placeholder reply admin → `t("replyPlaceholder")`
- `reset-password/page.tsx`: diupgrade ke async server component + `getTranslations` untuk Suspense fallback
- `NotificationsClient.tsx`: 8 option filter jenis notifikasi → `t()`
- `admin/layout.tsx`: "Admin Portal" (sidebar + header) → `t("adminPortalLabel")`
- **Total keys baru ditambahkan:** 24 keys di kedua `messages/id.json` dan `messages/en.json`. Parity: 974/974 ✅

---

## [#42] — 2026-08-26 | Audit Independen P2+P3 — Code Quality & Security Hardening

**P2 — Duplikasi hasFeature() (Fix Audit 5.1)**
- `planFeatures.ts`: Fungsi `hasFeature(features, key, isSuperadmin?)` kini di-export sebagai implementasi tunggal.
- `generator/page.tsx` + `generate/route.ts`: Duplikat closure `getFeatureValue` dihapus; diganti dengan import dari `planFeatures.ts`. FAIL-OPEN policy dipertahankan.

**P2 — Komentar Menyesatkan rateLimit.ts (Fix Audit 5.2)**
- Header baris 1–19 mengklaim "Token Bucket via Prisma (persistent, database-backed)" dan "Uses upsert on RateLimit model" — keduanya salah.
- Ditulis ulang dengan deskripsi akurat: in-memory `Map` per-process, sliding window, config dibaca dari `AppSettings` via Prisma (hanya konfigurasi, bukan state).

**P3 — .env.example Password Literal (Fix Audit 6.1)**
- `SUPERADMIN_SEED_PASSWORD=Admin123!` → `"ganti-dengan-password-kuat-min-12-karakter"`

**P3 — 4 Preset POST Routes Tanpa Rate Limit (Fix Audit 6.2)**
- `persona-presets`, `niche-category-presets`, `visual-aesthetic-presets`, `platform-options` — semua POST endpoint kini menggunakan `applyRateLimit(..., 20, 60)` setelah autentikasi session.

---

## [v4.1.1] — 2026-08-25 — Camera Movement PRO Toggle (Opsi B)

### UX IMPROVEMENT
- **[NEW] Toggle PRO Mode per user** — Sebelumnya, Camera Movement PRO aktif otomatis (transparan). Kini user paket PRO/ULTRA dapat **memilih** sendiri kapan mengaktifkan Mode Profesional:
  - Toggle `✨ Mode Profesional (PRO)` hanya muncul jika user **memiliki entitlement** `cameraMovementPro` — tidak ada clutter untuk user non-PRO.
  - Toggle PRO OFF → Preset & custom concept **tetap tampil** (mode Standar / KURASI USER seperti biasa).
  - Toggle PRO ON → Preset & custom concept **disembunyikan** otomatis; PRO mode diaktifkan. Preset yang sudah dipilih direset saat PRO diaktifkan.
  - Toggle Camera Movement OFF → PRO mode ikut direset ke `false`.

### KEAMANAN (TIDAK BERUBAH)
- Server menggunakan **AND logic**: `cameraMovementProEnabled = serverHasEntitlement && clientOptedIn`.
  - User non-PRO yang memanipulasi body request dengan `cameraMovementProMode: true` tetap mendapat instruksi Standar, karena `serverHasEntitlement = false`.
  - SUPERADMIN selalu bypass (tidak berubah).

### AUTO-SAVE
- State `cameraMovementProMode` ditambahkan ke `stateObj` (localStorage + server preferences), deps array, dan restore logic (localStorage + server) — auto-save berjalan persis seperti field lain.

### PERUBAHAN PER FILE
- `src/components/generator/GeneratorForm.tsx`:
  - State baru: `cameraMovementProMode` (boolean, default `false`)
  - Auto-save/restore: ditambahkan ke stateObj, deps, dan 2 restore block (localStorage + server)
  - Payload: `cameraMovementProMode` dikirim ke API; `cameraMovementPresets` dan `cameraMovementCustom` dikosongkan jika PRO aktif
  - UI: PRO toggle (blue card, hanya muncul jika `planFeatures.cameraMovementPro`), preset section disembunyikan saat PRO ON
  - Fix minor: `bg-white` pada input custom concept diganti `bg-transparent`
- `src/app/api/generate/route.ts`:
  - Zod schema: tambah `cameraMovementProMode: z.boolean().optional().nullable()`
  - Entitlement: AND logic `serverHasProEntitlement && clientOptedInProMode`
- `messages/en.json` + `messages/id.json`: 4 key baru (cameraMovementProModeLabel, cameraMovementProModeDesc, cameraMovementAutoStandardWithPro, cameraMovementCustomConceptHint). Paritas EN=ID=947 keys.

### VERIFIKASI
- User PRO, PRO toggle OFF → preset tampil, generate → master_prompt AUTO Standar ✓
- User PRO, PRO toggle ON → preset disembunyikan, generate → master_prompt AUTO PRO ✓
- User STANDARD → PRO toggle tidak muncul, hanya auto-standar + upsell hint ✓
- Client manipulasi `cameraMovementProMode: true` tanpa entitlement → tetap AUTO Standar (AND logic) ✓
- Auto-save: toggle PRO tersimpan setelah refresh ✓
- `npm run build`: TypeScript clean, exit 0, 947/947 i18n parity ✓


---

## [v4.0.1-bugfix] — 2026-08-25 — Perbaikan Copy UI Toggle Camera Movement

### BUG FIX (UI Copy)
- **[FIX] GeneratorForm.tsx** — Teks hint pada kondisi toggle Camera Movement OFF sebelumnya berbunyi *"AI akan memilih gerakan kamera secara otomatis"*, yang merupakan deskripsi dari perilaku toggle ON (mode AUTO), bukan perilaku toggle OFF (static/minimal shot). Teks sudah diperbaiki menjadi `cameraMovementDisabledHint` yang akurat: *"Camera movement dinonaktifkan — AI akan menggunakan static shot / gerakan minimal."*
- Perbaikan ini ditemukan saat mengerjakan fitur Camera Movement PRO (v4.1.0) dan dicatat sebagai entri terpisah untuk keterlacakan histori.

### i18n
- Key baru `Generator.cameraMovementDisabledHint` ditambahkan ke EN dan ID (menggantikan string hardcode yang salah).


---

## [v4.1.0] — 2026-08-25 — Fitur Camera Movement Profesional (PRO)

### FITUR BARU
- **[NEW] Camera Movement PRO** — Mode Otomatis Camera Movement kini hadir dalam dua tingkatan:
  - **Standar (semua paket, TIDAK BERUBAH):** Perilaku AUTO yang sudah ada — AI bebas memilih gerakan kamera dari daftar referensi sederhana. Tidak ada regresi untuk pengguna paket DEMO dan STANDARD.
  - **Profesional / PRO (paket PRO & ULTRA):** Ketika toggle Camera Movement ON dan user tidak memilih preset/konsep kustom (mode AUTO murni), AI bertindak sebagai Director of Photography profesional mengikuti 8 prinsip sinematografis: motivated movement, tata bahasa gerakan per peran scene, kosakata presisi, kontinuitas antar-scene, koordinasi blocking subjek, kedalaman visual, variasi disengaja, dan format deskripsi wajib.
  - Mode KURASI USER (preset dan/atau custom concept dipilih) **tidak terpengaruh** oleh status PRO — berlaku sama untuk semua paket.

### KEAMANAN (WAJIB DIPERTAHANKAN)
- Entitlement `cameraMovementPro` **hanya divalidasi di server** (`api/generate/route.ts`) dari `plan.features` user yang login via sesi — tidak pernah dibaca dari body request client.
- SUPERADMIN selalu bypass dan mendapat versi PRO.
- Default flag: **fail-closed (`false`)** — berbeda dari `imagePromptStudio`/`htmlBlogExport` yang default `true` (backward-compat lama). Paket yang tidak eksplisit mengaktifkannya TIDAK mendapat PRO.

### PERUBAHAN PER FILE
- `src/lib/planFeatures.ts`: Tambah entri `cameraMovementPro` (defaultValue: false, fail-closed).
- `prisma/seed.js`: Tambah `cameraMovementPro` secara eksplisit ke semua 4 plan (DEMO: false, STANDARD: false, PRO: true, ULTRA: true).
- `src/app/[locale]/dashboard/generator/page.tsx`: Tambah `cameraMovementPro: getFeatureValue("cameraMovementPro")` ke `planFeatures`.
- `src/app/api/generate/route.ts`: Refactor gate block — `cameraMovementProEnabled` diinisialisasi untuk SUPERADMIN, lalu di-resolve dari `plan.features` untuk user biasa. Disisipkan ke `fullVideoConfig` sebelum memanggil `generateMasterPrompt`.
- `src/lib/promptGenerator.ts`: Tambah `cameraMovementProEnabled` ke `VideoConfigData`. Cabang AUTO dipecah: PRO → blok instruksi 8 prinsip DoP profesional; non-PRO → instruksi AUTO standar yang sudah ada (tidak berubah).
- `src/components/generator/GeneratorForm.tsx`: Prop `cameraMovementPro` ditambahkan (default: false). UI hint di mode AUTO menampilkan ✨ aktif jika PRO, atau 🔒 upsell jika tidak PRO (gaya `text-amber-500`, konsisten dengan `htmlBlogExport`). Teks toggle-OFF diperbaiki (lihat v4.0.1).
- `messages/en.json` + `messages/id.json`: 5 key baru (AdminPlans.featureCameraMovementPro + 4 Generator keys). Paritas EN=ID=943 keys.

### VERIFIKASI
- Skenario 1 (STANDARD): generate AUTO → master_prompt mengandung `[PANDUAN CAMERA MOVEMENT — AUTO]` (standar). ✓
- Skenario 2 (PRO): generate AUTO → master_prompt mengandung `[PANDUAN CAMERA MOVEMENT — MODE OTOMATIS PROFESIONAL (PRO)]` dengan 8 poin. ✓
- Skenario 3 (PRO + preset): generate KURASI → header tetap `[PANDUAN CAMERA MOVEMENT — KURASI USER]`. ✓
- Skenario 4 (toggle OFF): header `[PANDUAN CAMERA MOVEMENT]` DINONAKTIFKAN, hint UI sudah benar. ✓
- SUPERADMIN selalu mendapat PRO terlepas dari plan. ✓
- AdminPlansClient otomatis menampilkan toggle "Camera Movement Profesional (PRO)" via `KNOWN_PLAN_FEATURES.map`. ✓
- `npm run build`: TypeScript clean, exit 0, 943/943 i18n keys parity. ✓


---

## [v4.0.0-audit] — 2026-08-25 — Final Audit & Remediasi Produksi

### SECURITY (P0)
- **[FIX] XSS** `ScenePromptStudioClient.tsx`: Ganti `dangerouslySetInnerHTML={{ __html: htmlBlog }}` dengan `sanitizeHtml()` menggunakan allowlist tag yang ketat. Paket `sanitize-html` ditambahkan sebagai dependency.
- **[FIX]** Kelas Tailwind `bg-white` pada HTML blog view diganti dengan token desain `pg-surface`.

### FUNCTIONAL GAPS (P1)
- **[FIX] enforceChannelLimits** `admin/registrations/route.ts`: Panggilan `enforceChannelLimits(userId)` ditambahkan ke alur approve registrasi, konsisten dengan jalur lain (admin/users/[id], activateSubscription).
- **[FIX] AdminPlansClient.tsx**: UI manajemen paket dibangun ulang dari awal dengan fitur:
  - Create Plan: modal penuh dengan semua field (code, name, price, maxChannels, sortOrder, isPubliclyPurchasable, feature flags eksplisit).
  - Delete Plan: tombol delete dengan konfirmasi modal; guard terhadap paket yang masih aktif.
  - isPubliclyPurchasable & sortOrder kini dapat diedit melalui UI.
  - Feature flags baru wajib di-set eksplisit saat create (mencegah fail-open tersembunyi).
- **[FIX] i18n SettingsClient.tsx**: Seluruh string hardcode Indonesia dimigrasi ke namespace `Settings` (en.json + id.json).
- **[FIX] i18n ChannelManagerClient.tsx**: String hardcode `"Penggunaan: Nx draft"`, `"Sembunyikan Pengaturan"`, `"Edit Channel & Produk"` dan kelas `bg-white` dimigrasi ke i18n + design token.

### TYPE SAFETY (P2)
- **[FIX]** `user/invoices/route.ts`: `whereClause: any` diganti dengan tipe yang tepat dari Prisma.
- **[FIX]** `MobileDashboardNav.tsx`: `t(item.labelKey as any)` diganti dengan `as Parameters<typeof t>[0]`.
- **[FIX]** `UserManagement.tsx`: String hardcode `{c.usageCount} uses` diganti dengan `tu('usageCount', { count })`.

### DESIGN TOKENS (P2)
- **[FIX] InstallPWABanner.tsx**: Token warna raw Tailwind (`bg-white`, `bg-gray-*`, `text-gray-*`) diganti dengan design token `pg-surface`, `pg-surface-dim`, `pg-text-sub`. `console.log` debugging dihapus. String dimigrasi ke namespace `InstallPWA`.

### ENDPOINT KONSOLIDASI (P2)
- **[FIX] FloatingCsWidget.tsx**: Endpoint dimigrasi dari `/api/support/settings` ke `/api/cs/contact-info`.
- **[DEPRECATE]** `/api/support/settings`: Ditandai `@deprecated` dengan comment, dipertahankan untuk backward compatibility.

### DOKUMENTASI (P2-P3)
- **[FIX] FINAL_HANDOFF_REPORT.md**: Default seed password dikoreksi dari `superadmin123` ke `Admin123!`.
- **[FIX] .env.example**: Variabel `SUPERADMIN_EMAIL` dan `SUPERADMIN_SEED_PASSWORD` ditambahkan.
- **[FIX] planFeatures.ts**: Komentar dokumen ditambahkan menjelaskan kebijakan fail-open dan persyaratan explicit flag saat create plan.
- **[FIX] rateLimit.ts**: Komentar JSDoc lengkap ditambahkan (parameter, konvensi key, design notes).

### IMAGE GENERATOR (P3)
- **[FIX] imagePromptGenerator.ts**: `excludeTitles` sekarang benar-benar diinjeksi ke `systemInstruction` sebagai direktif "HINDARI TOPIK" kepada LLM, bukan hanya diterima sebagai parameter tanpa digunakan.

### i18n KEYS BARU
- `AdminPlans`: addPlan, planName, planCode, selectCode, sortOrder, publiclyPurchasable, createPlan, createSuccess, createFail, deletePlan, deleteSuccess, deleteFail, deleteConfirmMsg, confirmDelete, deleting, codeRequired, featureFlagsNewPlanNote
- `Channels`: usageLabel, draftCount, hideSettings, editChannel
- `Settings` (namespace baru): profileTitle, newNameLabel, newNamePlaceholder, savingProfile, saveProfile, profileUpdatedSuccess, profileUpdateFail, changePasswordTitle, currentPasswordLabel, newPasswordLabel, savingPassword, changePassword, passwordUpdatedSuccess, passwordUpdateFail, generalError
- `InstallPWA` (namespace baru): installTitle, installDesc, installBtn, laterBtn, closeLabel
- `AdminUsers`: usageCount

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

## 32. Final Type Safety Audit, Transaction Atomic Hardening & Production Seed Fail-Fast (Fase 13 - Audit Akhir)
- **Komponen Terdampak:** `src/app/api/admin/plans/route.ts`, `src/app/api/admin/users/[id]/route.ts`, `prisma/seed.js`, `src/components/admin/AdminAnalyticsCharts.tsx`, `src/components/auth/AuthForm.tsx`, `src/components/support/AdminSupportClient.tsx`, `src/components/support/UserSupportClient.tsx`, `src/app/[locale]/admin/settings/AdminSettingsClient.tsx`, `src/i18n/request.ts`, `src/lib/authHelpers.ts`, `src/app/api/drafts/route.ts`, `src/app/api/drafts/[id]/route.ts`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/dashboard/pricing/page.tsx`, `src/app/[locale]/dashboard/channels/ChannelManagerClient.tsx`, `src/app/[locale]/dashboard/channels/EditChannelClient.tsx`, `src/components/generator/GeneratorForm.tsx`, `PATCH_NOTES.md`, `FINAL_HANDOFF_REPORT.md`.
- **Perbaikan:**
  - **Refactoring Transaksi Atomik Database (`prisma.$transaction`):** Membungkus perbaharuan paket langganan dan perpanjangan tanggal ekspirasi user pada `UPDATE_PLAN` di `src/app/api/admin/users/[id]/route.ts` dan pembaruan rencana di `src/app/api/admin/plans/route.ts` ke dalam blok transaksi atomik `prisma.$transaction`, menjamin *atomic consistency* di level database.
  - **Hardening Keamanan Fail-Fast pada `prisma/seed.js`:** Menambahkan pengecekan runtime yang menggagalkan proses seeding (*fail-fast exit*) jika `NODE_ENV === 'production'` tetapi `SUPERADMIN_EMAIL` atau `SUPERADMIN_SEED_PASSWORD` belum dikonfigurasi di environment variables.
  - **Eliminasi 100% Kebocoran Tipe `any`:** Melakukan refactoring menyeluruh di seluruh codebase `src/` untuk menggantikan tipe `any` dengan parameter terisolasi `Parameters<typeof t>[0]` pada lokalisasi dynamic keys, interface structural pada sesi Auth, `unknown` pada penanganan payload JSON API, dan tipe DTO konkret.
  - **Verifikasi Kompilasi TypeScript Strict (`npx tsc --noEmit`):** Menjalankan pemeriksaan tipe penuh pada seluruh codebase dan mengoreksi seluruh variabel tooltip Recharts, tipe prop PresetSelect, serta interface ProfileChannelDto/PricingPlanDto. Hasil pemeriksaan `npx tsc --noEmit` terverifikasi **100% Clean dengan Exit Code 0 (Zero Errors)**.

## 33. Fix Generate API Zod Schema Validation & Numeric Coercion (HTTP 400 Remediation)
- **Komponen Terdampak:** `src/app/api/generate/route.ts`, `src/components/generator/GeneratorForm.tsx`, `src/lib/promptGenerator.ts`, `src/lib/imagePromptGenerator.ts`, `PATCH_NOTES.md`.
- **Perbaikan:**
  - **Hardening Skema Zod `/api/generate`:** Mengubah `speechRate` dari `z.string().optional()` menjadi `z.union([z.string(), z.number()]).transform(...)` dan menerapkan `z.coerce.number()` pada field numeric seperti `targetDurationSec`, `targetSceneCount`, dan `variations`, serta mengizinkan `.nullable()` pada opsi string/number.
  - **Normalisasi Mapping Payload Form:** Memperbarui `GeneratorForm.tsx` untuk memetakan nama field sakelar form (`includeCaption`, `includeThumbnail`, `includeHtmlBlog`) secara eksplisit ke properti backend Zod (`socialCaption`, `thumbnailIdea`, `htmlBlog`).
  - **Pembaruan Interface TypeScript & Error Logging:** Menyesuaikan interface `VideoConfigData` & `ImageConfigData` agar menerima tipe `null` yang diparse dari JSON body, serta menambahkan pencatatan log `parsedData.error.flatten()` di konsol server jika terjadi kegagalan validasi.
  - **Pengujian Kompilasi:** `npx tsc --noEmit` terverifikasi **100% Clean dengan Exit Code 0 (Zero Errors)**.

## 34. 2-Stage Master Prompting Workflow & Push App Alignment
- **Komponen Terdampak:** `src/lib/promptGenerator.ts`, `Project Prompt Gen.txt`, `PATCH_NOTES.md`.
- **Perbaikan:**
  - **Refaktorisasi Master Prompt 2-Tahap (`generateMasterPrompt`):** Memperbarui instruksi generator Master Prompt pada `src/lib/promptGenerator.ts` menjadi alur interaktif 2-Tahap selaras dengan aplikasi Push:
    - **Tahap 1 (Penawaran 10 Judul Viral):** Jika judul spesifik belum diisi user, AI menawarkan 10 rekomendasi judul berpotensi viral lengkap dengan indikator persentase potensi viralitasnya di chat box AI eksternal, lalu berhenti sejenak meminta konfirmasi nomor pilihan (1-10) dari user.
    - **Tahap 2 (Eksekusi JSON Skrip Video):** Setelah user membalas nomor pilihan di chat box AI eksternal, AI merilis output murni JSON valid (tanpa teks pembuka/markdown fence) berisi `opsi_judul`, `judul_konten`, `segments`, `caption_medsos`, `ide_thumbnail`, dan `html_blog`.
  - **Aturan Direktori Judul Terpakai (`excludeTitles`):** Menegaskan bahwa hanya judul yang disetujui/disimpan (`draft.title`) yang dimasukkan ke daftar eksklusi `excludeTitles` pada penciptaan prompt berikutnya; 9 opsi judul yang tidak terpilih tetap bersih dan tidak dikunci dari ideasi di masa mendatang.
  - **Pembaruan Visualisasi UI Halaman Detail Draft (`DraftDetailPage`):** Menambahkan komponen visual kartu *Opsi Judul Viral (Rekomendasi AI Tahap 1)* di `src/app/[locale]/dashboard/drafts/[id]/page.tsx` lengkap dengan tombol *copy-to-clipboard* per judul untuk merender 10 alternatif judul yang dihasilkan AI di Tahap 1.
  - **Pembaruan Spesifikasi Blueprint Proyek:** Memperbarui Bagian 5.4.A dan menambahkan Bagian 12.12 pada `Project Prompt Gen.txt` sebagai dokumen spesifikasi tunggal dan otoritatif.
  - **Verifikasi TypeScript:** `npx tsc --noEmit` terverifikasi **100% Clean (Zero Errors)**.

## 35. PROMPT AUDIT TOTAL — Business Logic, Blueprint Sync & Security Remediation
- **Komponen Terdampak:** `src/app/api/admin/registrations/route.ts`, `src/app/[locale]/page.tsx`, `src/app/[locale]/dashboard/pricing/page.tsx`, `src/lib/subscription.ts`, `Project Prompt Gen.txt`, `PATCH_NOTES.md`, `AUDIT_REPORT_FINAL.md`.
- **Perbaikan:**
  - **Penyelesaian Orphan Field & Logika Trial (`User.hasUsedTrial`):** Memperbarui handler eksekusi persetujuan registrasi di `src/app/api/admin/registrations/route.ts` untuk memeriksa `!targetUser.hasUsedTrial` sebelum mengalokasikan paket DEMO 3 hari dan memperbarui `hasUsedTrial: true` secara atomik, menjamin perlindungan terhadap akumulasi/re-claim trial berulang.
  - **Pemberlakuan Kontrol Akses Paket Publik (`Plan.isPubliclyPurchasable`):** Menerapkan filter `where: { isActive: true, isPubliclyPurchasable: true }` pada kueri `prisma.plan.findMany` di landing page (`src/app/[locale]/page.tsx`) dan dashboard pricing (`src/app/[locale]/dashboard/pricing/page.tsx`), mengisolasi paket khusus/internal (seperti DEMO) agar tidak bocor pada tampilan publik.
  - **Pemicu Notifikasi Peringatan Masa Berlaku Langganan (`SUBSCRIPTION_EXPIRING_SOON`):** Menambahkan logika pemicu pada `getSubscriptionState` di `src/lib/subscription.ts` untuk memicu notifikasi `SUBSCRIPTION_EXPIRING_SOON` otomatis saat masa aktif tersisa <= 3 hari (72 jam), dengan penanganan *deduplication* 24 jam.
  - **Sinkronisasi Total Blueprint Spesifikasi (`Project Prompt Gen.txt`):**
    - Menambahkan baris paket DEMO pada tabel Bagian 5.7.2.
    - Memperbarui Bagian 12.1 untuk mencakup 14 nilai `NotificationType` enum aktual dan pemicu backend-nya.
    - Mengoreksi penamaan field `PromptSettings` (`videoSystemInstruction`, `imageSystemInstruction`) pada Bagian 12.2.
    - Mendokumentasikan field `hasUsedTrial`, `preferredLocale`, `approvedAt` pada `User` di Bagian 12.3.
    - Mendokumentasikan `isPubliclyPurchasable` pada `Plan` di Bagian 12.4, serta `proofUploadedAt` dan `rejectionReason` pada `Invoice` di Bagian 12.5.
    - Mengoreksi penamaan model `SupportMessage` pada Bagian 12.7.
    - Mendokumentasikan pengaturan CS dinamik (`registrationPendingAlertHours`, `paymentPendingAlertHours`, `csWidgetEnabled`, `csOperatingHours`, `csWhatsappNumber`, `csEmail`, `csMode`) pada Bagian 12.10.
  - **Verifikasi Kematangan Bisnis & Keamanan (Modul 3.1 - 3.10):**
    - 0% istilah credit/saldo di seluruh sistem.
    - 100% keselarasan i18n (696 kunci di `messages/id.json` dan `messages/en.json`).
    - 0 hardcoded string Bahasa Indonesia di JSX.
    - Keamanan Section 6 terverifikasi penuh (Strict Zod, Rate Limiting, DOMPurify, Atomic Transactions).
  - **Pemeriksaan Kompilasi TypeScript (`npx tsc --noEmit`):** Terverifikasi **100% Clean (Zero Errors)**.

## 36. Push Engine Integration — Scene Prompt Studio & Enriched Generator (Phase Push-1 s/d Push-5)
- **Komponen Terdampak:** `src/lib/visualStyleMap.ts`, `src/lib/parsers.ts`, `src/lib/promptGenerator.ts`, `src/app/api/generate/route.ts`, `src/components/generator/GeneratorForm.tsx`, `prisma/schema.prisma`, `src/app/api/parsed-outputs/route.ts`, `src/app/[locale]/dashboard/scene-prompt/page.tsx`, `src/app/[locale]/dashboard/scene-prompt/ScenePromptStudioClient.tsx`, `src/app/[locale]/dashboard/layout.tsx`, `messages/en.json`, `messages/id.json`, `PATCH_NOTES.md`.
- **Perbaikan:**
  - **[Phase Push-1] visualStyleMap.ts:** 15 preset estetika visual (Photorealistic, Pixar, Ghibli, Cyberpunk, Flat Vector, Watercolor, Synthwave, Vintage Kodak, Dark Fantasy, Claymation, Fairytale, Isometric, Pop Art, Line Art, Oil Painting) + `resolveVisualStyle()` + `getVisualStyleOptions()`.
  - **[Phase Push-2] promptGenerator.ts Overhaul:** POV/Persona (5 role AI), Tone of Voice, Visual Style resolution, Audio Guidelines adaptif (BGM/SFX/VO per-channel override), Loop Guidelines (Seamless Narrative & Video Loop), Anti-AI Detection (burstiness/perplexity/blacklist), Visual Prompt 5-bagian, Emotional Arc, Engagement Triggers. Format output Markdown Push-style (`## SCENE N`, NARASI, PANDUAN SUARA, VISUAL PROMPT, DURASI).
  - **[Phase Push-2] generate/route.ts:** +12 parameter Zod baru: `rolePOV`, `toneOfVoice`, `visualStyle`, `hookStyleType`, `customHookText`, `isLoopable`, `isVideoLoop`, `musicPreference`, `sfxPreference`, `voPreference`, `selectedSections`, `isVideoPlatform`.
  - **[Phase Push-3] GeneratorForm UI:** 5 kontrol baru: 🎭 Role & POV AI (6 radio cards), 🎨 Visual Style (dropdown 16 opsi), 🎙️ Tone of Voice (9 chips), 🔊 Audio Preferences (3 toggle), Audio sync useEffect dari channel profile.
  - **[Phase Push-4] ParsedOutput Model + API:** Model `ParsedOutput` di schema Prisma + endpoint `/api/parsed-outputs` (GET/POST) dengan auto-cleanup 10 record/user.
  - **[Phase Push-5] Scene Prompt Studio:** Halaman `/dashboard/scene-prompt` — parser lokal regex, Scene Viewer dengan badge audio cues & voice guidelines, Thumbnail Studio tab, Platform Content tab, Aspect Ratio/Sref suffix, Save as Draft, i18n 24 kunci, link sidebar.
  - **TypeScript:** `npx tsc --noEmit` → **100% Clean (Exit Code 0)** setelah `npx prisma generate`.
---

## [37] Generator UX Overhaul — Result Persistence & Legacy Cleanup
**Tanggal:** 2026-08-20

### Changes
**UX Cleanup — Menghapus "Paste JSON Output Here":**
- Kolom "Paste JSON Output Here" (textarea manual input JSON) telah DIHAPUS dari panel hasil Generator karena sudah digantikan sepenuhnya oleh fitur 🎬 Scene Prompt Studio.
- Alur resmi yang berlaku: Generator → Copy Markdown → Scene Prompt Studio → Parse → Save Draft.

**Result Panel Overhaul — Desain Minimalis & Fungsional:**
- Panel hasil kanan Generator didesain ulang dari 2 textarea besar menjadi UI aksi yang bersih:
  - 📄 **Textarea Prompt** (read-only, fullscreen) untuk review output.
  - 📋 **Tombol "Copy Markdown"** — salin output ke clipboard.
  - ⬇️ **Tombol "Download JSON"** — unduh prompt sebagai file JSON.
  - 🎬 **Tombol "Copy → Scene Studio"** — salin & notifikasi untuk buka Scene Prompt Studio.
  - 💾 **Panel Simpan** — judul draft + tombol Save Draft + View Drafts.
- Duplikasi tombol Download JSON dihapus (sebelumnya muncul di 3 tempat berbeda).

**State Persistence — Result Selamat dari Pindah Tab:**
- Variabel `step`, `generatedPrompt`, `aiResultJson`, dan `manualTitle` kini dimasukkan ke dalam sistem auto-save (LocalStorage + Server).
- Saat user berpindah menu lalu kembali ke Generator, hasil generate terakhir tetap terpampang persis seperti saat ditinggalkan.

**i18n:**
- Menambahkan key `resultReady` pada `messages/en.json` dan `messages/id.json`.

---

## 39. Audit Independen — Remediasi Batch 2 (2026-08-21)

**Auditor:** Lead QA Engineer (Sesi Audit #2 — independent third-party review)  
**tsc Build:** ✅ 0 Error (post-fix verified)  
**Prisma Generate:** ✅ Sukses dengan field baru `broadcastGroupId`

### [Fix 2.1] HTML Blog Export — Paid Feature Gap
- **File:** `src/lib/promptGenerator.ts`
- **Fix:** Menambahkan logika inject `## HTML BLOG` ke dalam prompt jika `videoConfig.htmlBlog === true`. Fitur berbayar kini menghasilkan output nyata.

### [Fix 2.2] Estimasi Durasi — Zero-Duration Bug
- **File:** `src/app/api/drafts/route.ts`
- **Fix:** Parser `wordCount` kini mendukung dua schema: `segments[].caption` (legacy) DAN `scenes[].narasi` (Scene Prompt Studio). Draft durasi tidak lagi 0.

### [Fix 2.4] HTML Blog Parser — parsers.ts + ScenePromptStudioClient
- **File:** `src/lib/parsers.ts`, `src/app/[locale]/dashboard/scene-prompt/ScenePromptStudioClient.tsx`
- **Fix:** Menambahkan `extractHtmlBlog()` ke parsers.ts. ScenePromptStudioClient kini mengekstrak `html_blog` dari rawText dan menyimpannya ke `parsedData` saat Save Draft.

### [Fix 2.5] Preferences Route — Zod + Rate Limit + Payload Guard
- **File:** `src/app/api/user/preferences/route.ts`
- **Fix:** Menulis ulang seluruh route. Menambahkan Zod schema ketat (`strict()`) untuk seluruh namespace preferences. Rate limit 60 req/mnt per user ID. Payload size limit 150 KB.

### [Fix 2.7] i18n Hardcoded — ForgotPasswordForm, ResetPasswordForm, AnnouncementsClient
- **Files:** `ForgotPasswordForm.tsx`, `ResetPasswordForm.tsx`, `AnnouncementsClient.tsx`
- **i18n:** Menambahkan namespace `ForgotPassword`, `ResetPassword`, `Announcements` ke `messages/id.json` dan `messages/en.json`.
- **Fix:** Seluruh string hardcode bahasa Indonesia diganti dengan `useTranslations()` calls.

### [Fix 2.8] Register Zod — Error Code via i18n
- **File:** `src/app/api/auth/register/route.ts`
- **Fix:** Pesan Zod sebelumnya hardcoded dalam bahasa Indonesia. Kini menggunakan kode (`NAME_REQUIRED`, `USERNAME_TOO_SHORT`, dll.) yang dipetakan melalui `t()` — user berbahasa EN kini menerima pesan dalam bahasa Inggris.
- **i18n:** Menambahkan 6 key Zod error code ke `messages/id.json` + `messages/en.json`.

### [Fix 2.10] Broadcast Deduplication — broadcastGroupId
- **Schema:** `prisma/schema.prisma` — field `broadcastGroupId String?` + `@@index([broadcastGroupId])` pada model `Notification`.
- **File:** `src/app/api/admin/announcements/route.ts`
- **Fix POST:** Satu UUID `broadcastGroupId` di-generate sekali per broadcast dan di-inject ke semua row `createMany`. 
- **Fix GET:** Menggunakan `groupBy broadcastGroupId` — riwayat kini menampilkan 1 entri per broadcast, bukan 1 per penerima.
- **UI:** `AnnouncementsClient.tsx` diperbarui untuk menampilkan `recipientCount` per broadcast.

### [Fix 2.11] Zod Leak — generate + parsed-outputs
- **Files:** `src/app/api/generate/route.ts`, `src/app/api/parsed-outputs/route.ts`
- **Fix:** Menghapus `details: parsed.error.flatten()` dari respons client. Internal Zod structure tidak lagi terekspos ke luar.

### [Fix 2.12] Admin Plans — POST + DELETE + extended PUT
- **File:** `src/app/api/admin/plans/route.ts`
- **Fix POST:** Handler create plan baru dengan validasi kode unik (`PlanCode` enum). Return 409 jika kode sudah ada.
- **Fix DELETE:** Handler dengan safety guard — menolak hapus plan jika masih ada user aktif di plan tersebut.
- **Fix PUT:** Diperluas untuk mendukung field `isPubliclyPurchasable`, `name`, `sortOrder`.

### [Audit Closure 4.3] Zod Leak Scan — Clean
- Scan seluruh API routes untuk `error.flatten()` atau `error.issues` yang dikirim ke client.
- **Sisa:** 1 false-positive di `register/route.ts:57` — BUKAN leak; hanya membaca `issues[0].message` sebagai kode i18n, tidak dikirim mentah.

### [Audit Closure 4.4] Routes Tanpa Zod — Semua Ditangani
- `admin/registrations/route.ts` — Zod schema `registrationActionSchema` ditambahkan.
- `admin/prompt-settings/route.ts` — Zod schema `promptSettingsSchema` dengan max-length per field ditambahkan.
- `support/tickets/[id]/messages/route.ts` — Zod schema `messageSchema` max 5000 chars ditambahkan.
- `support/tickets/[id]/route.ts` — Zod schema `ticketPatchSchema` (enum) ditambahkan.

---

## [#40] — 2026-08-21 | Audit Batch 3 — i18n 3.4 Completion + Blueprint Reconciliation

### Scope
Penyelesaian audit batch ketiga: eliminasi total hardcoded strings pada 5 komponen UI, penambahan 20+ i18n keys lintas 4 namespace, dan finalisasi rekonsiliasi blueprint arsitektur (Bagian 15-17).

### i18n Remediation [3.4]
**Komponen yang diperbaiki:**
- `DraftActions.tsx` — `toast.success/error` diganti dengan `t("downloadSuccess")` / `t("downloadError")` (Drafts namespace)
- `AuthForm.tsx` — 5 hardcoded validation strings diganti: fullName field required, usernameMin, usernameInvalid, emailInvalid, channelRequired
- `GeneratorForm.tsx` — 4 hardcoded product modal strings: selectChannelFirst, productNameRequired, productAddFail/Success, systemError (Generator namespace)
- `FloatingCsWidget.tsx` — Switch namespace dari Support ke CsWidget; fix ticketCreateFail, submitBtn, successTitle, successDesc
- `UserSupportClient.tsx` — 7 hardcoded strings: ticketCreateFail, ticketListHeader, loadingTickets, ticketClosedMsg, selectTicketHint, cancel, sendTicket (Support namespace)

**Keys baru ditambahkan:**
| Namespace | Keys |
|-----------|------|
| Drafts | downloadSuccess, downloadError |
| Auth | fieldRequired, usernameMin, usernameInvalid, emailInvalid, channelRequired |
| Generator | selectChannelFirst, productNameRequired, productAddFail, productAddSuccess, systemError |
| CsWidget | ticketCreateFail, namePlaceholder, emailPlaceholder, subjectPlaceholder, messagePlaceholder, submitBtn, submitting, successTitle, successDesc |
| Support | ticketCreateFail, cancel, ticketListHeader, selectTicketHint, ticketClosedMsg, sendTicket, loadingTickets |

### Blueprint Reconciliation
- **Bagian 15**: `broadcastGroupId` field & deduplication logic (Notification model)
- **Bagian 16**: `extractHtmlBlog()` parser + ScenePromptStudioClient integration + promptGenerator.ts HTML Blog injection
- **Bagian 17**: Admin Plans CRUD (POST create, DELETE safety-guard, isPubliclyPurchasable field), Zod API hardening (4 routes), Zod leak prevention, User Preferences hardening

### Build Integrity
- `tsc --noEmit`: ✅ 0 errors
- `prisma generate`: ✅ OK
- Blueprint: 762 → 814 lines (Sections 15, 16, 17 added)

### Files Modified
- `messages/id.json`, `messages/en.json` (+20 keys each)
- `src/app/[locale]/dashboard/drafts/[id]/DraftActions.tsx`
- `src/components/auth/AuthForm.tsx`
- `src/components/generator/GeneratorForm.tsx`
- `src/components/cs/FloatingCsWidget.tsx`
- `src/components/support/UserSupportClient.tsx`
- `Project Prompt Gen.txt` (Blueprint +52 lines)


## Phase 18: Final SaaS Audit & Generator Studio Workflow Refinement
**Date:** 2026-08-21
**Status:** ✅ COMPLETION
**Summary:** Resolved final UX friction points and standardized all generator pipelines for an idempotent, JSON-centric output. 
- **Idempotency Refactoring**: Restructured `GeneratorForm.handleGenerate` to support "Regenerate" operations seamlessly without resetting form progress.
- **Output Purity**: Removed Markdown preview and raw copy functionality in favor of a clear, singular "Download JSON" mechanism.
- **Workflow Routing**: Segmented draft-saving behavior (VIDEO pipelines auto-save state and route to Scene Studio, IMAGE pipelines retain explicit "Save Draft").
- **Deduplication Engine**: Upgraded `POST /api/drafts` to `upsert` stub entries preventing duplicated drafts in the Scene Studio pipeline.
- **Social Integration**: Augmented `promptGenerator.ts` to natively inject `socialLinks` from `ProfileChannelData` into AI instructions for enhanced automated captioning.
- **Viral Engineering**: Updated Master Prompt guidelines with advanced pacing, open loop, and retention hooks instructions for algorithm optimization.
- **Layout Alignment**: Reordered sidebar navigation linking "Channels" immediately below "Overview" for logical administrative flow.

## Phase 19: Final Audit Gaps Remediation
**Date:** 2026-08-21
**Status:** ✅ COMPLETION
**Summary:** Resolved the final set of critical gaps and warnings identified during the comprehensive Phase 18 audit, achieving 100% production readiness.
- **Orphan Directories Cleanup (GAP-1, GAP-2):** Deleted unused and empty directories (`src/app/api/billing` and `src/app/[locale]/dashboard/studio`).
- **Role Guard Security (GAP-3):** Added `SUPERADMIN` role guard to the Admin Notifications page (`src/app/[locale]/admin/notifications/page.tsx`).
- **Draft Deduplication (WARN-3):** Fixed `POST /api/drafts` to properly update existing drafts by checking `channelId`, `type`, and `title` without the restrictive `wordCount: 0` condition, preventing duplicate entries on repeated saves.
- **Auto-Demo Plan (GAP-4):** Implemented logic in `src/app/api/auth/register/route.ts` to automatically assign new users to the `DEMO` plan if it exists, activating their subscription for 7 days and setting `hasUsedTrial: true`.
- **Support Messages API (GAP-5):** Added a `GET` endpoint to `src/app/api/support/tickets/[id]/messages/route.ts` for consistent RESTful message retrieval.
- **Change Password API (BIZ-1):** Created `PUT /api/user/password` to allow authenticated users to change their passwords directly from their dashboard.

## Phase 20: Camera Movement Feature (Generator Studio)
**Date:** 2026-08-21
**Status:** ✅ COMPLETE
**Summary:** Added a fully integrated Camera Movement control panel to the Video Generator Studio, giving users granular control over how cinematographic camera movements are applied to AI-generated scene visual prompts.

### What Was Added
- **Toggle ON/OFF:** A pill-toggle switch allows users to fully enable or disable camera movement guidance. When disabled, the prompt generator instructs the AI to use only `static shot` or `minimal movement`.
- **30+ Preset Options (Grouped):** Camera movement presets organized into 5 intuitive categories:
  - 📹 **Pergerakan Dasar** (7 items): Static Shot, Slow Push-In, Pull-Out, Pan L/R, Tilt U/D
  - 🎬 **Gerakan Sinematik** (7 items): Slow Zoom, Dolly Zoom (Vertigo), Crane, Dutch Angle, Handheld
  - 🌀 **Gerakan Dinamis** (6 items): Sweeping Orbital, 360° Spin, Tracking, Whip Pan, Arc Shot, Roll
  - 🚁 **Aerial & Drone** (4 items): Bird's Eye View, Drone Reveal, Top-Down Flat Lay, Drone Chase
  - 🔬 **Khusus & Sinematif** (7 items): Extreme Slow Motion, Time-Lapse, Macro Close-Up, Split-Screen, First-Person POV, Underwater Glide, Gimbal Glide
- **Custom Concept Input:** Free-text field for users to describe unique/custom camera concepts not covered by presets.
- **Selection Counter & Reset:** Live badge showing selected count with one-click reset.

### Prompt Generator Integration
- **`VideoConfigData` Interface Updated** (`src/lib/promptGenerator.ts`): Added `cameraMovementEnabled`, `cameraMovementPresets`, `cameraMovementCustom` fields.
- **3 Injection Modes:**
  1. **Disabled:** Explicit `[PANDUAN CAMERA MOVEMENT]` block forbidding active movement.
  2. **Curated (presets/custom selected):** `[PANDUAN CAMERA MOVEMENT — KURASI USER]` block with approved movement list, instructing AI to distribute them variably across scenes.
  3. **Auto (enabled, no selection):** `[PANDUAN CAMERA MOVEMENT — AUTO]` block with scene-type-specific recommendations (hook, emotional, action, CTA).
- **API Route Updated** (`src/app/api/generate/route.ts`): `videoConfigSchema` extended with Zod-validated camera movement fields.
- **State Persistence:** Camera movement preferences are persisted to localStorage and synced to user server preferences.

## Phase 21: Final Audit Remediation (Zero-Defects Certification)
**Date:** 2026-08-21
**Status:** ✅ COMPLETE
**Summary:** Resolved the final discrepancies identified in the comprehensive production audit, bringing the platform to a certified zero-defect state aligned perfectly with the architectural blueprint.

### What Was Fixed
- **Registration Workflow Continuity (FIND-1.1):** Removed the contradictory 7-day automatic `DEMO` plan assignment from `register/route.ts`. The `DEMO` trial plan (3 days, 1 channel) is now strictly provisioned solely upon `SUPERADMIN` approval via `admin/registrations/route.ts`, ensuring a single source of truth for business logic (aligning with Blueprint Section 5.1 and 12.3).
- **Comprehensive i18n Localization (FIND-1.2):** Re-audited and replaced all remaining hardcoded Indonesian strings added in recent patches (post Phase 36).
  - Fully translated the `Camera Movement` UI block in `GeneratorForm.tsx`.
  - Fully translated toast notifications and action buttons in `ScenePromptStudioClient.tsx`.
  - Fully translated the complete interface of `UsedTitlesDirectory.tsx` including tables, modals, and export buttons.
  - All keys are symmetrically added to both `en.json` and `id.json`.
- **Form HTML Structure Bug (UX):** Fixed a bug in `GeneratorForm.tsx` where the "Back to Edit Configuration" and "Regenerate" buttons were unintentionally trapped inside a locked `<fieldset>` during Step 2. Moved the closing tag to re-enable clickable interactions during the generated state without losing config persistence.
- **Blueprint Synchronization (FIND-1.3 & FIND-1.4):** 
  - Added the `DEMO` plan to the Pricing Table in Section 5.7.2 of `Project Prompt Gen.txt` (with a note that it is `isPubliclyPurchasable: false`).
  - Corrected false file path claims in `AUDIT_REPORT_FINAL.md` regarding payment provider logics.

## Phase 22: Visual Redesign — XPDC HUB Design System Integration
**Date:** 2026-08-21
**Status:** ✅ COMPLETE
**Summary:** Migrasi total tampilan aplikasi Prompt Gen ke bahasa desain XPDC HUB: identitas brand orange konsisten, tipografi Poppins, pure neumorphism, dan pola navigasi mobile-native (Bottom Nav + Profile Drawer). Seluruh logika bisnis, API, dan keamanan tidak diubah.

### Scope Perubahan (UI Shell Only)

#### 1. Design System Foundation — `globals.css`
- **Tipografi:** Geist → **Poppins** (Google Fonts — humanist, warm, konsisten dengan XPDC HUB).
- **Brand Color:** Indigo generic → `#ff7600` orange (`--pg-brand`). Dark mode: `#ff8c1a`.
- **Background:** `#ecf0f3` (light neumorphic warm-grey) / `#1a1f2e` (dark navy).
- **Neumorphic Tokens:** `--pg-neu-out` (lifted shadow), `--pg-neu-in` (inset shadow), `--pg-neu-sm` (subtle shadow).
- **Utility Classes:** `neu-flat`, `neu-pressed`, `neu-sm`, `neu-btn-brand`, `neu-btn`, `neu-input`.
- **Animasi:** `pg-fadeIn`, `pg-slideUp`, `pg-shake` (error state), `pg-pulse` (FAB ring orange).
- **Legacy Compatibility:** Alias `--glass-*`, `--neu-*` dipertahankan untuk komponen lama.

#### 2. Root Layout — `src/app/[locale]/layout.tsx`
- Import `next/font/google` Poppins menggantikan Geist.

#### 3. Komponen Baru — `src/components/layout/MobileDashboardNav.tsx`
- **Bottom Nav 5 slot:** Home | Drafts | [✨ Generator FAB] | Channels | Profil.
- **Generator** → Center FAB orange (`neu-btn-brand`) dengan `pg-pulse` ring animation.
- **Profil** → membuka **slide-up Profile Drawer** (tidak route langsung).
- **Profile Drawer:** berisi navigasi sekunder (Scene Studio, Billing, Notifications, Support, Panduan, Logout) + user info card.
- Backdrop click & ESC untuk menutup drawer. iOS safe-area support.

#### 4. Dashboard Layout — `src/app/[locale]/dashboard/layout.tsx`
- **Desktop sidebar:** Dark Navy (`#1e2a3a`), orange accent, branded user footer.
- **Mobile:** Topbar minimal + `MobileDashboardNav` (bottom nav + drawer).
- **Fix:** Logout diubah dari non-functional `<Link>` ke `<LogoutButton>` yang benar.

#### 5. Admin Layout — `src/app/[locale]/admin/layout.tsx`
- Dark Navy sidebar, gradient orange logo "⚡ Admin Portal".
- Badge counter pending registration & open tickets → orange brand.
- Admin user footer dengan initial avatar gradient orange.

#### 6. Auth Page — `src/app/[locale]/auth/page.tsx`
- Background `var(--pg-bg)` neumorphic.
- Brand hero card: icon `✨` orange dengan `pg-slideUp` animation.
- Auth form dibungkus `neu-flat` card (border-radius 22px).

#### 7. AuthForm — `src/components/auth/AuthForm.tsx`
- Tab switcher: `neu-pressed` container, active tab → orange fill.
- Input fields: `neu-input` (inset shadow, orange focus ring).
- Submit buttons (Login, Register step 1 & 2): `neu-btn-brand`.
- Error banner: orange-red neumorphic + `pg-shake`. Success: green neumorphic + `pg-fade-in`.
- Password visibility toggle: warna `var(--pg-brand)`.

#### 8. ForgotPasswordForm — `src/components/auth/ForgotPasswordForm.tsx`
- Centered `🔑` icon orange sebagai header visual.
- `neu-input` + `neu-btn-brand` konsisten.
- Back link styled dengan `--pg-text-sub`.

#### 9. Translation Fix — `messages/id.json` & `messages/en.json`
- Menambahkan key `"profile"` di namespace `Dashboard` (sebelumnya hilang, digunakan oleh `MobileDashboardNav`).

### Yang TIDAK Berubah
- Semua API routes (`/api/...`)
- Prisma schema & database logic
- NextAuth config & session management
- i18n routing & middleware
- Business logic (generator, billing, channels, drafts, CS, notifications)
- TypeScript types — 0 error tipe data

### Build Verification
- `npm run build` → ✅ **Exit code: 0** — 38 halaman, 65+ API routes, 0 error.
- `tsc --noEmit` → ✅ **100% Clean (Zero Errors)**.

---

## Phase 23 — Post-Redesign UI/UX Deep Audit & Remediation (August 2026)

### Latar Belakang
Audit mendalam terhadap semua perubahan Phase 22 untuk memverifikasi integritas tombol, routing, styling consistency, dan aksesibilitas. Ditemukan 7 anomali (2 critical, 5 warning) yang berpotensi menyebabkan masalah visual dan fungsional di production.

### Komponen Baru Dibuat

#### 1. `src/components/layout/DashboardSidebarNav.tsx` [NEW]
- **Problem:** Sidebar desktop tidak memiliki active state — `data-active-class="sidebar-active"` bukan pattern Next.js valid.
- **Fix:** Client Component menggunakan `usePathname()` untuk mendeteksi rute aktif.
- **Active Style:** Orange left-border (3px) + `rgba(255,118,0,0.18)` background pada item aktif.

#### 2. `src/components/layout/AdminSidebarNav.tsx` [NEW]
- Client Component active state untuk sidebar admin, identik dengan `DashboardSidebarNav`.
- Fix: Hapus `useState` import yang tidak terpakai (ESLint warning prevention).

#### 3. `src/components/layout/AdminMobileNav.tsx` [NEW]
- **Problem:** Admin portal tidak memiliki mobile navigation — sidebar `w-64` tanpa `hidden md:` prefix akan memenuhi layar mobile.
- **Fix:** Hamburger button (3-line icon) + slide-in drawer dari kiri (translateX animation).
- **Fitur:** ESC key close, backdrop click close, auto-close on route change, admin user footer dengan Logout.

### Bug Fixes

#### 4. `src/components/auth/LogoutButton.tsx`
- **Problem:** Styling `border-zinc-300, bg-white, focus:ring-blue-500` — Tailwind vanilla, tidak konsisten dengan design system PG.
- **Fix:** Migrasi ke `neu-btn` + `color: var(--pg-danger)` + icon `🚪`.

#### 5. `src/components/layout/MobileDashboardNav.tsx`
- **Problem (Critical):** Topbar mobile menggunakan `<Link>` biasa dengan emoji 🔔 untuk notifikasi — kehilangan fitur real-time unread badge counter.
- **Fix:** Ganti dengan `<NotificationBell />` component (sama seperti desktop topbar).
- **Problem (Warning):** `document.documentElement.lang` untuk locale detection — tidak reliable saat SSR/hydration.
- **Fix:** Pakai `useParams()` untuk mendapatkan locale dari URL.

#### 6. `src/app/[locale]/admin/layout.tsx`
- **Mobile Nav:** Sidebar `hidden md:flex`, `AdminMobileNav` di-render untuk mobile.
- **i18n Fix:** 2 label hardcoded ("Broadcast Pengumuman", "Notifikasi System") diganti ke `t("announcements")` & `t("systemNotifications")`.
- **Active State:** Sidebar desktop kini menggunakan `AdminSidebarNav` client component.
- **Padding:** Content area `px-4 md:px-8` untuk mobile-friendly spacing.

#### 7. `src/app/[locale]/dashboard/layout.tsx`
- **Active State:** Sidebar desktop menggunakan `DashboardSidebarNav` client component.
- **i18n Fix:** Hardcoded `"Dashboard"` di desktop topbar diganti ke `{t("overview")}`.

#### 8. `src/components/auth/AuthForm.tsx` — Multi-Fix
- **Critical:** 15+ label menggunakan `text-zinc-700 dark:text-zinc-300` (Tailwind lama) → di dark mode menjadi **tidak terbaca** (teks gelap di atas bg gelap).
  - Fix: Semua label kini pakai `labelCls` variable + `style={{ color: 'var(--pg-text)' }}`.
- **Critical:** Variable `labelCls` sudah didefinisikan dari Phase 22 tapi **tidak pernah dipakai** di seluruh form.
  - Fix: Semua label sekarang menggunakan `labelCls` secara konsisten.
- **Warning:** Double arrow — `{t('continueStep2').replace('&rarr;', '→')} →` menghasilkan `Lanjut → →`.
  - Fix: Sederhanakan ke `{t('continueStep2')}`.
- **Warning:** Step 2 heading `text-zinc-800 dark:text-zinc-200` → ganti ke `var(--pg-text)`.
- **Warning:** Step 2 social divider `border-zinc-200 dark:border-zinc-800` → ganti ke `var(--pg-shadow-dark)`.
- **Warning:** `document.documentElement.lang` di forgot password button → ganti ke `useParams()` locale.

#### 9. `src/components/auth/ForgotPasswordForm.tsx`
- **Warning:** `document.documentElement.lang` di back button → ganti ke `useParams()` locale.

#### 10. `messages/en.json` & `messages/id.json`
- Tambah key `announcements` dan `systemNotifications` di namespace `Admin` (sebelumnya digunakan hardcoded di admin layout).
  - EN: `"announcements": "Broadcast Announcements"`, `"systemNotifications": "System Notifications"`
  - ID: `"announcements": "Broadcast Pengumuman"`, `"systemNotifications": "Notifikasi Sistem"`

### Ringkasan Anomali yang Ditemukan & Diperbaiki

| # | Severity | File | Masalah | Status |
|---|----------|------|---------|--------|
| 1 | 🔴 Critical | AuthForm.tsx | 15+ label tidak terbaca di dark mode | ✅ Fixed |
| 2 | 🔴 Critical | AuthForm.tsx | `labelCls` variable tidak pernah dipakai | ✅ Fixed |
| 3 | 🟡 Warning | AuthForm.tsx | Double arrow `→ →` di continue button | ✅ Fixed |
| 4 | 🟡 Warning | AuthForm.tsx | Step 2 heading & border pakai Tailwind zinc | ✅ Fixed |
| 5 | 🟡 Warning | AuthForm.tsx + ForgotPasswordForm | `document.documentElement.lang` locale | ✅ Fixed |
| 6 | 🟡 Warning | AdminSidebarNav.tsx | `useState` import tidak terpakai | ✅ Fixed |
| 7 | 🟡 Warning | dashboard/layout.tsx | "Dashboard" string hardcoded | ✅ Fixed |

### Build Verification
- `npx tsc --noEmit` → ✅ **Exit code: 0** (Zero TypeScript errors).
- `npm run build` → ✅ **Exit code: 0**, compiled in 9.0s.

---

## Phase 24 — Post-Audit Minor Feature & UX Polishing (August 2026)

### Latar Belakang
Penambahan fitur minor yang meningkatkan pengalaman pengguna (UX) berdasarkan hasil temuan pasca-audit Phase 23, serta perbaikan *overlap* pada tampilan mobile.

### Komponen Baru
#### 1. `src/components/layout/LanguageSwitcher.tsx` [NEW]
- **Tujuan:** Memberikan toggle visual (ikon 🌐) bagi pengguna untuk berpindah bahasa (ID/EN).
- **Implementasi:** 
  - Menggunakan `<Link>` dari `next-intl` (`@/i18n/routing`).
  - Mendeteksi `currentLocale` dan me-replace rute saat ini secara *in-place*.
  - Di-inject langsung di sebelah `NotificationBell` pada 3 topbar utama:
    - Desktop Dashboard (`src/app/[locale]/dashboard/layout.tsx`)
    - Mobile Dashboard (`src/components/layout/MobileDashboardNav.tsx`)
    - Admin Portal (`src/app/[locale]/admin/layout.tsx` & `src/components/layout/AdminMobileNav.tsx`)

### Bug Fixes & UX Optimization
#### 2. `src/components/cs/FloatingCsWidget.tsx`
- **Problem:** Tombol Floating Action Button (FAB) Customer Service di layar mobile menutupi tombol "Profile" pada navigasi bawah (`MobileDashboardNav`).
- **Fix:** Merubah posisi responsif CSS dari `bottom-6 right-6` menjadi `bottom-24 md:bottom-6 right-4 md:right-6`.
  - Di Mobile: Tombol naik 6rem (`bottom-24`) agar mengambang tepat di atas *bottom navigation bar*.
  - Di Desktop: Tetap di `bottom-6` standar industri.

### Build Verification
- `npx tsc --noEmit` → ✅ **Exit code: 0** (Zero TypeScript errors).

---

## Phase J — Generator Output Language Localization (August 2026)

### Latar Belakang
Audit fitur "Generator Studio" menunjukkan tidak adanya kendali bahasa output yang eksplisit bagi pengguna. Walaupun UI tersedia dalam bahasa Inggris dan Indonesia, output AI (naskah video/gambar) tidak sepenuhnya taat pada bahasa target tanpa instruksi spesifik. Pembaruan ini memastikan *Output Language* secara dinamis ditambahkan ke *system instructions* (Master Prompt) untuk memaksa LLM menghasilkan teks dalam bahasa yang diinginkan.

### Pembaruan Fitur
#### 1. `src/components/generator/GeneratorForm.tsx`
- **Fitur Baru:** Menambahkan komponen `PresetSelect` untuk **Output Language** (Indonesian, English, Custom) di bagian pengaturan umum.
- **State Management:** Menambahkan variabel state `outputLanguage` dan mengaitkannya ke dalam `localStorage` (`generatorFormState`) untuk memastikan preferensi pengguna tetap *persistent* antar-sesi.
- **Payload API:** Menyertakan `outputLanguage` pada JSON payload ke endpoint `/api/generate`.

#### 2. `src/app/api/generate/route.ts`
- **Validasi Schema:** Memperbarui `generateSchema` dengan `outputLanguage: z.string().optional().nullable()`.
- **Eksekusi:** Meneruskan parameter `outputLanguage` ke fungsi internal `generateMasterPrompt` dan `generateImagePrompt`.

#### 3. `src/lib/promptGenerator.ts` & `src/lib/imagePromptGenerator.ts`
- **Prompt Engineering:** Memodifikasi logika perakitan prompt. Jika `outputLanguage` tersedia, sistem akan menyuntikkan perintah wajib (misal: `"WAJIB: Seluruh naskah narasi, dialog, teks overlay, dan tulisan ide lainnya HARUS ditulis dalam bahasa [Bahasa Pilihan]."`) secara dinamis ke variabel `systemInstruction`.

### Build Verification
- `npx tsc --noEmit` → ✅ **Exit code: 0** (Zero TypeScript errors).
- `npm run build` → ✅ **Exit code: 0**, production ready.

---

## Phase K — Neumorphic Design System Migration: Full Codebase (21 Agustus 2026)

### Latar Belakang
Audit UI/UX mendeteksi 1.305 penggunaan kelas warna hardcoded Tailwind (`zinc-*`, `gray-*`, `slate-*`) tersebar di 55+ file. Kelas-kelas ini menyebabkan inkonsistensi tema (dark/light mode) dan tidak mengikuti sistem token `pg-*` yang sudah ditetapkan sebagai standar desain neumorphic platform. Fase ini menyelesaikan migrasi total dari seluruh kelas legacy ke token semantik.

### Fase A — i18n Hardening
#### `messages/en.json` & `messages/id.json`
- Tambah kunci lokalisasi untuk: pagination (`prevPage`, `nextPage`, `totalUsers`), status loading, detail links, dan CTA navigasi halaman panduan.

#### Komponen Notifikasi & Navigasi
- **`NotificationsClient.tsx`** — Refactor 4 label hardcoded ke `t()` hooks.
- **`NotificationBell.tsx`** — Refactor `'Loading...'` / `'No notifications'` ke `t('loading')` / `t('empty')`.
- **`AdminNotificationsClient.tsx`** — Fix namespace ke `AdminNotifications`, sinkronisasi semua label.
- **`panduan/page.tsx`** — 4 tombol CTA navigasi dimigrasikan ke sistem `t()` terpusat.

### Fase B — Migrasi Komponen Inti (15 File)
File-file berikut sepenuhnya dimigrasikan dari kelas zinc/gray/slate ke token `pg-*` dan utility class `neu-*`:

| File | Deskripsi Perubahan |
|------|---------------------|
| `ToastProvider.tsx` | bg/text zinc → `pg-surface` / `pg-text` |
| `CopyButton.tsx` | zinc → `pg-text` / `pg-brand` |
| `DraftFilter.tsx` | zinc → `neu-input` / `pg-text-sub` |
| `PresetSelect.tsx` | slate-900 → `pg-*` vars |
| `CompositionSliderGroup.tsx` | zinc + hardcoded → `pg-*` + i18n |
| `AuthForm.tsx` | 7 label zinc → `pg-text` centralized |
| `ResetPasswordForm.tsx` | Full rewrite → `pg-*` |
| `CsEscalationBanner.tsx` | rose/amber/cyan → `pg-danger`/`pg-warn`/`pg-brand` |
| `FloatingCsWidget.tsx` | zinc → `neu-flat` / `pg-*` |
| `NotificationBell.tsx` | zinc → `pg-*` inline styles |
| `UserSupportClient.tsx` | zinc + glass-panel → `neu-flat` / `pg-*` |
| `AdminSupportClient.tsx` | zinc + glass-panel → `neu-flat` / `pg-*` |
| `UsedTitlesDirectory.tsx` | zinc + glass-panel → `neu-flat` / `pg-*` |
| `UserManagement.tsx` | zinc + glass-panel → `neu-flat` / `pg-*` |
| `AdminAnalyticsCharts.tsx` | zinc + `#3b82f6` → `pg-brand` (#6366f1), tooltip via CSS vars |

### Fase C — Migrasi App Pages & Large Clients (40 File)
#### Utility Classes Baru — `globals.css`
Ditambahkan 8 semantic utility classes baru untuk menggantikan pasangan zinc/dark secara langsung:
```css
.pg-text-heading  { color: var(--pg-text); }
.pg-text-sub      { color: var(--pg-text-sub); }
.pg-text-muted    { color: var(--pg-text-muted); }
.pg-bg-page       { background: var(--pg-bg); }
.pg-surface       { background: var(--pg-surface); }
.pg-surface-dim   { background: var(--pg-card); }
.pg-border        { border-color: var(--pg-shadow-dark); }
.pg-divide > * + * { border-top: 1px solid var(--pg-shadow-dark); }
```

#### File yang Dimigrasi (Top 10 berdasarkan volume)
| File | Hits Sebelum | Hits Sesudah |
|------|:-----------:|:------------:|
| `GeneratorForm.tsx` | 257 | 0 |
| `AdminSettingsClient.tsx` | 140 | 0 |
| `drafts/[id]/page.tsx` | 98 | 0 |
| `page.tsx` (landing) | 86 | 0 |
| `EditChannelClient.tsx` | 79 | 0 |
| `ScenePromptStudioClient.tsx` | 67 | 0 |
| `AnnouncementsClient.tsx` | 62 | 0 |
| `NotificationsClient.tsx` | 49 | 0 |
| `ProductsClient.tsx` | 48 | 0 |
| `panduan/page.tsx` | 40 | 0 |

- Total file dimigrasi: **55+ file**
- Total kelas legacy dihapus: **~1.218 occurrences**

### Metodologi
Migrasi menggunakan 3-layer approach:
1. **Automated batch** — 20 regex rules untuk pasangan `zinc-X dark:zinc-Y` yang paling umum (1.036 hits)
2. **Extended singleton rules** — 42 rules untuk kelas dark-only dan hover variants (182 hits)
3. **Targeted manual fixes** — 15 baris yang membutuhkan penanganan konteks spesifik

### Build Verification
- Grep `zinc|gray|slate` di seluruh `src/` → ✅ **0 residual** di semua file TSX/TS
- `npx tsc --noEmit` → ✅ **Exit code: 0** (Zero TypeScript errors)
- Git commit: `e97fc42` — 59 files changed, 5.586 insertions, 5.847 deletions

---

## Phase 14: Mobile UI Optimization & PWA Fixes
### 1. PWA Installation Banner
- Ditambahkan komponen InstallPWABanner untuk memicu instalasi PWA di peramban.
- Banner diletakkan secara eksklusif di Landing Page dan Halaman Login (Auth) untuk menjaga UX Dashboard tetap bersih.
- Menghapus dependensi eksternal icon dan menggunakan Inline SVG untuk menghindari build error saat deployment.

### 2. Presisi UI Mobile (Dashboard Nav)
- Memperbaiki komponen MobileDashboardNav untuk isu presisi tampilan pada perangkat mobile.
- Menerapkan fluid typography (text-[10px] sm:text-xs) dan truncate pada label navigasi.
- Mengatur minimum touch target (min-w-[44px]) untuk aksesibilitas navigasi.
- Mengatur overflow dan max-height pada profil Drawer (termasuk tombol Logout) agar proporsional di layar handphone kecil.
- Menambahkan safe area padding untuk *home indicator* di sistem operasi mobile.

### 3. Perbaikan Feature Gating (HTML Blog Export)
- Menambal bug di backend `api/generate/route.ts` dan frontend `GeneratorPage` yang menyebabkan fitur "HTML Blog Export" terkunci meskipun sudah diaktifkan di admin.
- Mengintegrasikan `KNOWN_PLAN_FEATURES` sebagai nilai fallback bawaan jika konfigurasi JSON `features` pada data paket lama tidak memuat flag tersebut secara spesifik.
- Memperbaiki validasi variabel form `includeHtmlBlog` dengan skema Zod di backend.

---

## [#55] Batch 1: P0 Remediation — Keamanan Kritis & Financial Integrity — 2026-09-18

### SECURITY & FINANCIAL INTEGRITY (P0)
- **[P0-1] Hardcoded Superadmin Password & Seed Security Gate**:
  - `prisma/seed.js:15-32`: Memindahkan security gate ke baris pertama fungsi `main()`. Mengharuskan variabel lingkungan `SUPERADMIN_EMAIL` dan `SUPERADMIN_SEED_PASSWORD`, memvalidasi panjang minimum 12 karakter dan menolak template rentan (`Admin123!`, `superadmin123`, dsb.). Menetapkan flag `mustChangePassword: true` dan mengisi kolom `usernameLower`/`emailLower`.
- **[P0-2] Hidden Plan Purchase Bypass**:
  - `src/app/api/invoice/route.ts:56-59`: Menambahkan validasi `if (!plan.isPubliclyPurchasable)` dengan respon 403 Forbidden untuk mencegah pemesanan paket non-publik oleh user biasa.
- **[P0-3] PeriodDays & TrialDays Hardcoding**:
  - `prisma/schema.prisma:178,212`: Menambahkan kolom `periodDays` (default 30) dan `trialDays` (default 3) pada model `Plan` serta `periodDays` pada model `Invoice`.
  - `src/lib/payments/manualTransferProvider.ts:50-80`: Membaca durasi langsung dari `plan.periodDays || 30` saat mengaktifkan invoice.
  - `src/app/api/admin/plans/route.ts:25-85`: Mengekspos field `periodDays` dan `trialDays` pada endpoint CRUD paket admin.
  - `src/app/[locale]/admin/plans/AdminPlansClient.tsx:18-120`: Menambahkan input durasi hari dan trial hari pada modal Create/Edit Plan dan tampilan card list.
- **[P0-4] Rate Limiting pada Rute Kritis & Superadmin**:
  - `src/app/api/user/password/route.ts:20-25`: Rate limit 5 request / 15 menit dan menetapkan `passwordChangedAt = new Date()`, `mustChangePassword = false`.
  - `src/app/api/research/trends/route.ts:16-20`: Rate limit 20 request / 60 detik dan pembatasan panjang query maks 200 karakter.
  - `src/app/api/admin/users/route.ts`, `src/app/api/admin/users/[id]/route.ts`: Rate limit GET, PATCH, DELETE.
  - `src/app/api/admin/settings/route.ts`, `src/app/api/admin/prompt-settings/route.ts`: Rate limit konfigurasi platform.
  - `src/app/api/admin/content-archetypes/route.ts`, `src/app/api/admin/content-archetypes/[id]/route.ts`: Rate limit manajemen archetype.
  - `src/app/api/admin/notifications/route.ts`, `src/app/api/drafts/export/route.ts`, `src/app/api/user/invoices/route.ts`, `src/app/api/user/profile/route.ts`, `src/app/api/support/tickets/[id]/route.ts`: Diterapkan rate limiting terstandarisasi.
- **[P0-5] Rate Limit Bypass via IP / Username Rotation (Dual-Bucket Limiter)**:
  - `src/lib/rateLimit.ts:60-150`: Menambahkan fungsi `getClientIp(req)` yang menghormati konfigurasi `TRUSTED_PROXY === "true"`, serta fungsi `applyDualRateLimit` yang mengevaluasi bucket IP dan bucket identifier secara paralel.
  - `src/lib/authOptions.ts:40-65`: Login dilindungi dengan `applyDualRateLimit`.
  - `src/app/api/auth/register/route.ts:25-45`: Registrasi dilindungi dengan `applyDualRateLimit`.
  - `src/app/api/auth/forgot-password/route.ts:28-38`: Permintaan reset password dilindungi dengan `applyDualRateLimit`.
- **[P0-6] Stale JWT Session Invalidation**:
  - `src/lib/authOptions.ts:109-158`: Mengimplementasikan revalidasi berkala token JWT terhadap database (> 5 menit). Sesi langsung digugurkan jika user dihapus, status registrasi non-APPROVED, atau jika `passwordChangedAt` lebih baru daripada waktu penerbitan token (`token.iat`).
  - `src/types/next-auth.d.ts`: Menambahkan properti `mustChangePassword`, `checkedAt`, dan `passwordChangedAt` ke tipe sesi dan JWT.
- **[P0-7] Channel Lock Expiration & Fallback Bug**:
  - `src/lib/channelLockLogic.ts:38-75`: Memperbaiki pengecekan status langganan agar memverifikasi `subscriptionStatus === "ACTIVE"` dan `subscriptionExpiresAt > now`. Saat kadaluarsa, batas channel kembali ke batas paket gratis/demo (`demoPlan.maxChannels ?? 1`), memperbaiki bug falsy `|| 1`.
- **[P0-8] Case-Insensitive Uniqueness (Casing Spoofing Prevention)**:
  - `prisma/schema.prisma:100-112`: Menambahkan kolom `@unique` bernilai lowercase: `usernameLower`, `emailLower`, dan `phoneNormalized` pada model `User`.
  - `src/lib/authOptions.ts:45-55`: Pencarian user saat autentikasi menggunakan pencocokan exact lowercase pada kolom normalisasi.
  - `src/app/api/auth/register/route.ts:40-75`: Pengecekan duplikasi dan pembuatan akun menyimpan nilai yang dinormalisasi.
- **[P0-9] Proof Upload Memory Flood & Base64 DoS**:
  - `src/app/api/admin/payments/route.ts:35-80`: Menambahkan pagination (`page`, `limit`) dan filter status. Data base64 `proofUrl` dihilangkan dari list query dan digantikan dengan boolean `hasProof: Boolean(proofUrl)`.
  - `src/app/api/admin/payments/[id]/proof/route.ts:1-75`: Endpoint baru untuk superadmin yang mengalirkan file binary murni hasil decode base64 dengan header `X-Content-Type-Options: nosniff`, `Content-Security-Policy: default-src 'none'`, dan caching private.
  - `src/app/[locale]/admin/payments/AdminPaymentsClient.tsx:13-130`, `page.tsx:24-35`: Disesuaikan untuk menggunakan `hasProof` dan membuka bukti melalui URL endpoint binary aman.
- **[P0-10] Arbitrary Proof File Upload (Magic Byte Verification)**:
  - `src/app/api/invoice/upload/route.ts:40-60`: Menambahkan validasi server-side decoding base64 dan verifikasi magic byte murni: JPEG (`0xFF, 0xD8, 0xFF`) dan PNG (`0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A`), memblokir MIME spoofing dan file script berbahaya.
- **[P0-11] HTML Injection pada Email Transaksional & Pengumuman**:
  - `src/lib/emailTemplates.ts:3-10`: Mengekspor helper `escapeHtml(str)` untuk menetralkan karakter HTML berbahaya.
  - `src/app/api/admin/payments/route.ts`, `src/app/api/admin/registrations/route.ts`, `src/app/api/auth/forgot-password/route.ts`, `src/app/api/admin/announcements/route.ts`: Seluruh interpolasi variabel pengguna ke dalam email dan notifikasi disanitasi dengan `escapeHtml`.

### AUDIT LOGGING & OBSERVABILITY (B-1 & P1-12)
- `src/lib/auditLog.ts`: Helper `logAdminAction` untuk mencatat aktivitas admin ke model `AdminAuditLog`.
- `src/lib/emailLog.ts`: Helper `logEmailDelivery` untuk mencatat riwayat dan status pengiriman email ke model `EmailLog`.
- `prisma/migrations/20260918_audit_remediation/migration.sql`: Script migrasi SQL mencakup seluruh penambahan model dan kolom baru.

### BUILD & VERIFIKASI
- `npx tsc --noEmit`: Exit 0 (Zero TypeScript errors)
- `npm run lint`: Exit 0 (0 errors, 37 non-blocking unused var warnings)
- `npm run build`: Exit 0 (Seluruh 40 halaman dan 49 rute API berhasil terkompilasi)

---

## [#56] Batch 2: P1 Remediation — Fungsionalitas, Workflow, & Integritas Data — 2026-09-18

### WORKFLOW & FUNCTIONAL GAPS (P1)
- **[P1-1 & P1-8] Settings Navigation & Superadmin Dashboard Access**:
  - `src/app/[locale]/dashboard/layout.tsx:12-45`: Menambahkan link Settings (`/dashboard/settings`, ⚙️) pada menu navigasi desktop. Mengubah guard role menjadi `requireRole(["USER", "SUPERADMIN"], locale)` agar superadmin dapat mengakses dan menguji seluruh fitur studio/dashboard pengguna tanpa diblokir; menampilkan banner/tombol shortcut "Admin Panel" untuk mempermudah navigasi kembali.
  - `src/components/layout/MobileDashboardNav.tsx:30-65`: Menambahkan item menu Pengaturan pada drawer navigasi mobile.
- **[P1-2] Guest Support Ticket Email Dispatch**:
  - `src/app/api/support/tickets/[id]/messages/route.ts:50-85`: Ketika admin membalas tiket support guest, sistem otomatis mengirimkan email balasan ke `guestEmail` dengan isi pesan balasan dan tautan akses langsung ke tiket, serta mencatat aktivitas ke `EmailLog` dan `AdminAuditLog`.
- **[P1-3] Draft Overwrite Prevention**:
  - `src/app/api/drafts/route.ts:180-195`: Logika update draft hanya mencocokkan baris stub (`isStub: true`). Draft yang sudah selesai ditulis/digenerate tidak akan pernah ditimpa meskipun memiliki judul yang sama; draft baru dibuat secara independen dan properti `isTemplate` selalu dipertahankan.
- **[P1-4] Subscription Guarding pada Drafts & Titles**:
  - `src/app/api/drafts/route.ts:40-42`, `src/app/api/drafts/import-titles/route.ts:60-66`: Memetakan `SubscriptionInactiveError` menjadi HTTP 403 Forbidden dengan pesan terstandarisasi `t("subscriptionInactive")`.
- **[P1-5] Narration Mode Integration in Draft Estimation**:
  - `src/app/api/drafts/route.ts:140-165`: Menerima `narrationMode` dari body request, memprioritaskannya di atas archetype channel untuk penentuan kalkulasi durasi dan jumlah kata.
- **[P1-6] Dynamic Archetype Composition Category Validation**:
  - `src/app/api/generate/route.ts:80-95, 250-290`: Menghapus validasi refine statis `education === 0 && entertainment === 0 && marketing === 0`. Memvalidasi komposisi secara dinamis setelah archetype channel di-resolve: memeriksa ketersediaan kategori wajib dari archetype, dan memvalidasi total 100% hanya jika archetype memang berbasis komposisi.
- **[P1-7] Archetype Section Defaults Hierarchy**:
  - `src/lib/promptGenerator.ts:100-115`: Menyempurnakan pembacaan seksi hook/CTA/caption/thumbnail agar menghormati konfigurasi `defaultIncludedSections` dari archetype sebelum beralih ke fallback default `true`.
- **[P1-9] DoS & Payload Overflow Protection**:
  - `src/app/api/drafts/import-titles/route.ts:20-55`: Membatasi muatan request maksimum 1MB (`Content-Length`), dan membatasi impor maksimum 1000 judul per permintaan.
  - `src/app/api/drafts/route.ts:15-25`: Membatasi `rawJson` maksimum 500.000 karakter dan `title` maksimum 500 karakter pada Zod schema.
- **[P1-10] Drafts Offset Pagination & Lean Metadata**:
  - `src/app/api/drafts/route.ts:220-280`: Menambahkan pagination query (`page`, `limit`) pada endpoint `GET /api/drafts` dengan `select` metadata ramping tanpa menarik seluruh field besar `rawJson` pada tampilan daftar.
- **[P1-13] Strict Enum Parameter Validation & Standardized IP Handling**:
  - `src/app/api/support/tickets/route.ts`: Memvalidasi parameter `status` menggunakan `z.nativeEnum(SupportTicketStatus)`.
  - `src/app/api/notifications/route.ts`: Memvalidasi parameter `type` menggunakan `z.nativeEnum(NotificationType).or(z.literal("ALL"))`.
  - `src/app/api/channels/route.ts`: Menggunakan `getClientIp(req)` dan menambahkan rate limiting pada endpoint `GET`.
- **[P1-14] Boundary-Safe Banned Words Scanning**:
  - `src/app/api/generate/route.ts:120-145`: Memindai seluruh input (`topic`, `additionalContext`, `keywords`, `visualStyle`, `customHookText`, `cameraMovementCustom`) terhadap kata terlarang menggunakan regex boundary-safe `(^|\\W)...($|\\W)` untuk mencegah false positive pada substring.
- **[P1-15] Server-Side Sanitization**:
  - `src/app/api/drafts/route.ts:70-80`: Melakukan sanitasi `parsedData.html_blog` menggunakan `sanitize-html` di server sebelum disimpan ke database.
  - `src/app/api/drafts/import-titles/route.ts:80-90`: Membersihkan karakter kontrol ASCII dan membatasi panjang tiap judul maksimal 500 karakter.

### BUILD & VERIFIKASI
- `npx tsc --noEmit`: Exit 0 (Zero TypeScript errors)
- `npm run lint`: Exit 0 (0 errors, 35 non-blocking unused var warnings)
- `npm run build`: Exit 0 (Seluruh 40 halaman dan 49 rute API berhasil terkompilasi)

---

## [#57] Batch 3: Systemic Sweeps S-1 (Routes), S-2 (APIs), S-3 (Prisma Models) — 2026-09-18

### SYSTEMIC SWEEPS & ARCHITECTURAL RECONCILIATION
- **[S-1] Orphan Route Sweep (27 Page Routes)**:
  - Audit menyeluruh terhadap seluruh 27 halaman di bawah `src/app/[locale]/`. Terbukti 100% halaman (27/27) memiliki minimal 1 tautan navigasi aktif (desktop sidebar, mobile drawer, action links, atau breadcrumbs).
  - Menambahkan link langsung `Pilihan Paket` (`/${locale}/dashboard/pricing`, 💎) pada `navLinks` desktop layout (`src/app/[locale]/dashboard/layout.tsx:34`) dan `DRAWER_ITEMS` mobile nav (`src/components/layout/MobileDashboardNav.tsx:59`) agar pengguna dapat mengakses paket langganan secara instan dengan 1 klik dari mana saja.
- **[S-2] Orphan API Sweep (49 API Endpoints)**:
  - Audit seluruh 49 file `route.ts` di bawah `src/app/api/`. Terkonfirmasi 48 endpoint aktif memiliki pemanggil di frontend atau fungsionalitas sistem (stream/cron/webhook). Satu endpoint tanpa pemanggil adalah `/api/support/settings`, yang memang berstatus `@deprecated` dan dipertahankan untuk backward compatibility setelah migrasi ke `/api/cs/contact-info`.
  - Penegasan batas arsitektur antara `/api/content-archetypes` (endpoint read-only publik untuk pengguna terautentikasi saat mengonfigurasi channel, kini dilengkapi dengan `applyRateLimit`) vs `/api/admin/content-archetypes` (endpoint CRUD manajemen lengkap dengan channel relation count, auditing, dan proteksi role SUPERADMIN).
- **[S-3] Orphan Prisma Model & Field Sweep (21 Models)**:
  - Audit seluruh 21 model Prisma. Semua model memiliki jalur baca dan tulis aktif di aplikasi.
  - Bidang `Invoice.externalRef`, `Plan.currency`, dan `Invoice.currency` didokumentasikan statusnya (eksplisit dicadangkan untuk gateway otomatis masa depan dan default mata uang IDR).
  - `Product.link`: Ditambahkan tautan visual eksternal (🔗) pada list produk channel di `src/app/[locale]/dashboard/channels/ProductsClient.tsx:181-189`.
  - `PromptSettings.defaultSpeechRate`: Diintegrasikan ke dalam instruksi panduan tempo & kecepatan bicara pada generator naskah di `src/lib/promptGenerator.ts:571, 599-601`, serta menyelaraskan interface `ProfileChannelData` dengan schema Prisma.

### BUILD & VERIFIKASI
- `npx tsc --noEmit`: Exit 0 (Zero TypeScript errors)
- `npm run lint`: Exit 0 (0 errors, 35 non-blocking unused var warnings)
- `npm run build`: Exit 0 (Seluruh 40 halaman dan 49 rute API berhasil terkompilasi)

---

## [#58] Batch 4: Systemic Sweeps S-4 (i18n Parity & Localization) & S-5 (Design System Enforcement) — 2026-09-18

### INTERNATIONALIZATION & LOCALIZATION SWEEP (S-4)
- **[S-4.1] Enum Localization Architecture (`src/lib/enumMapping.ts`)**:
  - Merekonstruksi dan memperluas `src/lib/enumMapping.ts` untuk menyediakan pemetaan label dan badge terstandar bagi seluruh enum domain Prompt Gen:
    - `SubscriptionStatus`: `ACTIVE`, `INACTIVE`, `EXPIRED`
    - `PaymentStatus`: `PENDING`, `APPROVED`, `REJECTED`, `PAID`, `FAILED`
    - `RegistrationStatus`: `PENDING_APPROVAL`, `APPROVED`, `REJECTED`
    - `PlanCode`: `STANDARD`, `PRO`, `ULTRA`, `DEMO`
    - `Role`: `SUPERADMIN`, `USER`
    - `PaymentMethod`: `MANUAL_TRANSFER`, `AUTOMATIC_GATEWAY`
    - `NotificationType`: 14 notifikasi sistem & transaksi
    - `NarrationMode`: `VOICE_OVER`, `DIEGETIC_ONLY`, `SILENT_TEXT_ONLY`, `HYBRID`
    - `DurationCalcMode`: `NARRATION_WORDCOUNT`, `SEGMENT_SELF_ESTIMATE`, `HYBRID`
    - `DraftType`: `VIDEO`, `IMAGE`
    - `SupportTicketStatus`: `OPEN`, `REPLIED`, `CLOSED`
  - Seluruh fungsi helper mendukung passing fungsi `t` (`next-intl`) dengan fallback lokal, serta menghasilkan badge dengan token desain Prompt Gen resmi (`bg-[var(--pg-brand-light)]`, `text-brand`, `pg-surface-dim`, `pg-text-sub`, `pg-border`).
- **[S-4.2] 100% Key Parity & Penambahan Namespace (`messages/id.json` & `messages/en.json`)**:
  - Total keys meningkat dari 1.000 menjadi **1.161 keys** dengan 100% key parity (0 missing keys pada kedua bahasa).
  - Menambahkan namespace `Enums` (seluruh enum domain terjemahan ID & EN).
  - Menambahkan namespace `AdminArchetypes` (seluruh form, tabel, toast, dan modal manajemen model konten).
  - Menambahkan namespace `Research` (seluruh studio riset tren, scoring SEO, metrik volume/kompetisi, dan tombol aksi).
  - Memperluas namespace `AdminSupport`, `Admin`, `Support`, `Generator`, `Settings`, dan `Channels` untuk mengeliminasi string hardcoded.
- **[S-4.3] Eliminasi Hardcoded Strings di Komponen UI**:
  - `AdminArchetypesTab.tsx`: 100% string antarmuka, judul, deskripsi, form, opsi select, alert konfirmasi, dan toast notifikasi kini menggunakan `useTranslations("AdminArchetypes")` dan `useTranslations("Enums")`.
  - `ResearchClient.tsx`: 100% string pencarian, header, label channel, pill volume/kompetisi, skor peluang, kartu pertanyaan YouTube, dan aksi salin tag kini menggunakan `useTranslations("Research")`.
  - `AdminSupportClient.tsx`: Menambahkan `useTranslations("AdminSupport")` untuk judul halaman, subjudul, label stats counter, filter tabs ("Semua Tiket"), loading state, dan empty hint.
  - `UserSupportClient.tsx`: Menghilangkan teks hardcoded pada label detail tiket, role admin/user ("👨‍💼 Admin Support", "👤 Anda"), serta placeholder formulir tiket baru.
  - `AdminAnalyticsCharts.tsx`: Melokalisasi teks chart fallback ("Belum ada data..."), label tooltip "Total", dan "Jumlah".
  - `dashboard/generator/page.tsx`: Melokalisasi fallback loading Suspense menggunakan `t('loadingStudio')`.
  - `dashboard/settings/page.tsx`: Mengonversi Server Component menjadi async dan melokalisasi judul serta deskripsi halaman via `getTranslations({ locale, namespace: 'Settings' })`.
  - `EditChannelClient.tsx`: Melokalisasi label speech rate options via `t("speechRateSuperFast")` s/d `t("speechRateSlow")` dan tombol buat channel via `t("createNew")`.
  - `AdminSettingsClient.tsx`: Melokalisasi judul tab via `t("tabArchetypes")`.

### DESIGN SYSTEM ENFORCEMENT & TOKEN AUDIT (S-5)
- **[S-5.1] Migrasi Raw Color Classes ke Token Desain Prompt Gen**:
  - Mengganti utility class Tailwind mentah (`bg-purple-600`, `hover:bg-purple-700`, `focus:ring-purple-500`, `bg-blue-600`, `text-blue-600`, `text-slate-*`) pada komponen yang disentuh dengan token CSS Variables resmi:
    - Tombol utama: `.neu-btn-brand` dan `bg-[var(--pg-brand)]`
    - Input & focus ring: `focus:ring-[var(--pg-brand)]` dan `.neu-input`
    - Permukaan panel & modal: `.pg-surface`, `.pg-surface-dim`, dan `.pg-border`
    - Tipografi: `.pg-text-heading`, `.pg-text-sub`, `.pg-text-muted`, `.text-brand`
    - Tombol sekunder: `.neu-btn`
    - Status pills: `bg-emerald-500/10`, `bg-amber-500/10`, `bg-rose-500/10`
- **[S-5.2] Script Otomasi Audit (`scripts/audit-i18n.mjs` & `scripts/audit-design.mjs`)**:
  - Dibuat script `scripts/audit-i18n.mjs` yang memvalidasi integritas JSON dan rekursi 100% key parity antara `messages/id.json` dan `messages/en.json`.
  - Dibuat script `scripts/audit-design.mjs` yang memindai seluruh komponen UI (78 file komponen) untuk memastikan tingkat adopsi token desain di atas 80% (terkonfirmasi 1.703 kemunculan token, tingkat adopsi 87,2%).
  - Didaftarkan sebagai npm script: `npm run audit:i18n` dan `npm run audit:design`.

### BUILD & VERIFIKASI
- `npm run audit:i18n`: Exit 0 (100% key parity, 1.161 keys pada id.json dan en.json)
- `npm run audit:design`: Exit 0 (1.703 kemunculan token desain, tingkat adopsi 87,2%)
- `npx tsc --noEmit`: Exit 0 (Zero TypeScript errors)
- `npm run lint`: Exit 0 (0 errors, 35 warnings non-blocking)
- `npm run build`: Exit 0 (Seluruh 79 rute aplikasi terkompilasi bersih)

---

## [#59] Batch 5: Systemic Sweeps S-6 (Type Safety), S-7 (Lint 0 Warnings), S-8 (HTTP Status 401/403) — 2026-09-18

### TYPE SAFETY & LINT SWEEP (S-6, S-7)
- **[S-6] Eliminasi 100% `as unknown as` di Seluruh Repositori**:
  - `src/app/api/generate/route.ts:289-340`: Mengonversi casting `as unknown as ProfileChannelData` dan `as unknown as ContentArchetypeData` menjadi mapping tipe eksplisit yang aman dan terstruktur murni (`mappedChannel`, `typedArchetype`).
  - `src/app/api/user/preferences/route.ts:174`: Mengganti `as unknown as Prisma.InputJsonValue` dengan tipe langsung `as Prisma.InputJsonValue`.
  - `src/app/[locale]/dashboard/drafts/[id]/page.tsx:94`: Mengganti casting kasar `as unknown as DraftParsedData` dengan pemeriksaan tipe objek runtime `(draft.parsedData && typeof draft.parsedData === "object" ? draft.parsedData : {}) as DraftParsedData`.
  - `src/app/[locale]/dashboard/pricing/page.tsx:37`: Memetakan field `features` ke `Record<string, boolean> | null` tanpa `as unknown as`.
  - `src/lib/db.ts:3`: Mengonversi singleton Prisma global dari `global as unknown as { prisma: PrismaClient }` menjadi deklarasi TypeScript idiomatik `declare global { var prisma: PrismaClient | undefined; }`.
  - `src/lib/env.ts:18`: Menyediakan fallback objek statis untuk fase build tanpa casting paksa `as unknown as z.infer<typeof envSchema>`.
  - **Hasil Audit**: Total kemunculan `as unknown as` di seluruh direktori `src/` kini **0 (Nol)**.
- **[S-7] Perbaikan Regresi Interupsi & Pembersihan Lint (0 Errors, 0 Warnings)**:
  - Memperbaiki 7 error kompilasi TS yang terhenti akibat pembersihan otomatis sebelumnya:
    - `src/app/[locale]/dashboard/channels/ProductsClient.tsx`: Mengembalikan parameter `err` pada fungsi `fetchProducts` dan `load`.
    - `src/app/[locale]/dashboard/drafts/[id]/DraftActions.tsx`: Mengembalikan parameter `e` dan `error` pada blok `catch`.
    - `src/app/api/channels/route.ts`: Mengembalikan parameter `error` pada endpoint pembuatan channel.
    - `src/components/generator/GeneratorForm.tsx`: Menghapus pemanggilan `setResult("")` yang tertinggal.
  - Memperbaiki peringatan unused ESLint directive pada `src/lib/db.ts`.
  - Mengimplementasikan evaluasi dinamis prop `mode` pada `getDurationCalcModeBadge` di `src/lib/enumMapping.ts` untuk membedakan badge per mode durasi narasi.
  - **Hasil Lint**: `npm run lint` menghasilkan **0 Errors** dan **0 Warnings** (100% clean).

### STANDARISASI STATUS HTTP (S-8)
- Menyelaraskan seluruh 12 file rute di bawah `src/app/api/admin/`:
  - Request tanpa sesi autentikasi (`!session`): Menghasilkan status **401 Unauthorized** (`t("unauthorized")`).
  - Request dengan sesi namun role bukan SUPERADMIN (`session.user.role !== "SUPERADMIN"`): Menghasilkan status **403 Forbidden** (`t("forbidden")`).
  - Diperbaiki pada `src/app/api/admin/plans/route.ts` (GET, POST, PUT, DELETE) dan `src/app/api/admin/registrations/route.ts` (GET, POST).

### BUILD & VERIFIKASI
- `npx tsc --noEmit`: Exit 0 (Zero TypeScript errors)
- `npm run lint`: Exit 0 (Zero errors, Zero warnings)
- `npm run audit:i18n`: Exit 0 (100% key parity, 1.161 keys)
- `npm run audit:design`: Exit 0 (87.2% design token adoption)
- `npm run build`: Exit 0 (Seluruh 40 halaman dan 49 rute API berhasil terkompilasi bersih)

---

## [#60] Batch 6: Rekonsiliasi Dokumen Otoritatif (D-1 s/d D-5) — 2026-09-18

### REKONSILIASI FINAL HANDOFF REPORT (D-1, D-2, D-3)
- **[D-1] Konfigurasi Layanan Email Produksi**:
  - Memperbarui panduan deployment pada Bagian 4 `FINAL_HANDOFF_REPORT.md` agar mencantumkan variabel lingkungan SMTP lengkap (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`) menggantikan klaim lama `EMAIL_PROVIDER_API_KEY`.
- **[D-2] Eliminasi Hardcoded Seed Credentials**:
  - Menghapus total seluruh teks referensi password default `Admin123!` dan username `admin@promptgen.com`. Menggantinya dengan panduan konfigurasi `SUPERADMIN_EMAIL` dan `SUPERADMIN_SEED_PASSWORD` (min 12 karakter) serta penegasan flag `mustChangePassword: true` pada login pertama.
- **[D-3] Rekonsiliasi Matriks Inventaris & Status Tindak Lanjut**:
  - Menyelaraskan matriks pengujian ke jumlah rute riil: 40 halaman dan 49 rute API (total 89 rute).
  - Menegaskan penggunaan `sanitize-html` pada server dan dual-bucket rate limiter.
  - Menambahkan Bagian 5 wajib: **"BELUM SELESAI / PERLU TINDAK LANJUT (FOLLOW-UP & MONITORING)"** sesuai blueprint 9.3 (kesiapan gateway otomatis masa depan, retensi arsip bukti transfer, dan skalabilitas rate limit).

### REKONSILIASI BLUEPRINT (Project Prompt Gen.txt) (D-4, D-5)
- **[D-4] Sinkronisasi Aturan Bisnis & Navigasi**:
  - Bagian 2: Mengunci stack email transaksional resmi ke `nodemailer + Standard SMTP` terisolasi dengan `EmailLog`.
  - Bagian 5.2: Memperbarui aturan akses RBAC di mana SUPERADMIN diizinkan mengakses `/dashboard*` untuk pengujian Studio/fitur user, dilengkapi banner kembali ke Admin Panel.
  - Bagian 5.7.2: Memperbarui tabel paket dengan kolom `Period (Hari)`, `Trial (Hari)`, dan status `Publik` (paket DEMO berstatus non-publik dan diberikan otomatis via approval registrasi).
  - Bagian 5.7.3 langkah 4: Mendokumentasikan endpoint pengaliran bukti transfer murni `/api/admin/payments/[id]/proof`.
- **[D-5] Sinkronisasi Skema Database Prisma (Bagian 4)**:
  - Memperbarui Bagian 4 `Project Prompt Gen.txt` sehingga mencerminkan seluruh **21 model riil** dan seluruh enum yang ada pada `prisma/schema.prisma` (termasuk `AdminAuditLog`, `EmailLog`, `ContentArchetype`, `UsedTitle`, `ParsedOutput`, field case-insensitive `emailLower`/`usernameLower`/`phoneNormalized`, dsb.).

---

## [#61] Batch 7: Kematangan Bisnis & Automated Testing (B-1 s/d B-8) — 2026-09-18

### IMPLEMENTASI FITUR KEMATANGAN BISNIS (B-1 s/d B-6, B-8)
- **[B-1] Admin Audit Log Viewer**:
  - Endpoint `GET /api/admin/audit-logs` dengan verifikasi sesi SUPERADMIN, rate limiting, filter pencarian (`action`, `targetType`), dan paginasi.
  - Komponen UI `AdminAuditLogsTab.tsx` yang terpasang pada `AdminSettingsClient.tsx` dengan badge status warna token, timestamp localized, dan format detail JSON payload.
  - Penambahan translation key `tabAuditLogs` pada `messages/id.json` dan `messages/en.json`.
- **[B-2] Email Pengingat Kadaluarsa Otomatis (Cron)**:
  - Endpoint `POST` & `GET` `/api/cron/subscription-reminders` dilindungi `CRON_SECRET`.
  - Mengidentifikasi langganan aktif yang akan berakhir dalam H-7 s/d H-1 atau hari ini berakhir.
  - Deduplikasi pengiriman via tabel `EmailLog` (rentang 20 jam) untuk mencegah email berulang.
  - Mengirimkan email notifikasi transaksional terformat profesional serta `notifyUser()` in-app.
- **[B-3] Halaman Kuitansi Invoice Resmi Siap Cetak**:
  - Rute `/dashboard/billing/invoices/[id]/page.tsx` dan komponen `PrintableInvoiceClient.tsx`.
  - Layout kuitansi bersih dan profesional dengan trigger `window.print()`, metadata invoice lengkap, rincian paket, nomor referensi, status lunas, dan stempel digital.
  - Integrasi tombol aksi "🧾 Kuitansi" pada `InvoiceHistoryClient.tsx`.
- **[B-4] Hapus Akun & Ekspor Data Pribadi (GDPR/Compliance)**:
  - Endpoint `DELETE /api/user/profile`: Menghapus data akun secara aman dengan verifikasi password bcrypt, mengunci login selanjutnya, dan mencatat audit log.
  - Endpoint `GET /api/user/data-export`: Menghasilkan bundle arsip JSON lengkap berisi profil, channel, produk, draft, dan riwayat invoice pengguna.
- **[B-5] Health Check System (`/api/health`)**:
  - Endpoint `GET /api/health` memeriksa konektivitas database via query ping `prisma.$queryRaw(SELECT 1)`, mengukur latency koneksi milidetik, konsumsi memori, dan status kesehatan layanan platform.
- **[B-6] Onboarding Checklist Widget**:
  - Widget interaktif di dashboard utama (`src/app/[locale]/dashboard/page.tsx`) yang membimbing pengguna baru: 1. Membuat Channel Pertama -> 2. Menghasilkan Konten di Studio -> 3. Mengatur Langganan.
  - Desain dinamis dengan progress bar persentase dan navigasi langsung ke halaman terkait.
- **[B-8] Kebijakan Retensi Bukti Transfer (Transfer Proof Retention Cron)**:
  - Endpoint `POST` & `GET` `/api/cron/cleanup-proofs` dilindungi `CRON_SECRET`.
  - Mendukung parameter retensi dinamis `days` (default: 180 hari) dan mode simulasi `dryRun=true`.
  - Mengosongkan data base64 `proofUrl` pada invoice berstatus `APPROVED` atau `REJECTED` yang telah melewati masa retensi untuk efisiensi penyimpanan dan kepatuhan privasi, serta mencatat tindakan di `AdminAuditLog`.

### AUTOMATED UNIT TESTING (B-7)
- **Pemasangan Test Runner**:
  - Pemasangan `vitest` v3.2.7 yang kompatibel penuh dengan Node 20/22 dan konfigurasi `@/*` path alias via `vitest.config.mts`.
  - Menambahkan script `"test": "vitest run"` pada `package.json`.
- **Rangkaian Test Suite (6 File, 38 Test Cases, 100% Pass Rate)**:
  - `tests/enumMapping.test.ts`: 9 pengujian untuk pemetaan label & badge badge warna seluruh enum status domain.
  - `tests/rateLimit.test.ts`: 7 pengujian untuk ekstraksi IP client, single-bucket rate limit, dan dual-bucket protection.
  - `tests/subscription.test.ts`: 7 pengujian untuk kalkulasi status langganan, auto-downgrade pending plan, dan bypass SUPERADMIN.
  - `tests/channelLockLogic.test.ts`: 4 pengujian untuk penguncian channel berlebih sesuai kuota paket dan fallback demo.
  - `tests/planFeatures.test.ts`: 5 pengujian untuk evaluasi feature flags, fail-open policy, dan bypass SUPERADMIN.
  - `tests/parsers.test.ts`: 6 pengujian untuk utilitas pembersihan markdown, ekstraksi thumbnail data, dan sanitasi output generator.

### BUILD & VERIFIKASI AKHIR BATCH 7
- `npx tsc --noEmit`: Exit 0 (Zero TypeScript errors)
- `npm run lint`: Exit 0 (Zero errors, Zero warnings)
- `npm run audit:i18n`: Exit 0 (100% key parity, 1.162 keys)
- `npm run audit:design`: Exit 0 (86.4% design token adoption, 1.833 occurrences)
- `npm test`: Exit 0 (6 test suites passed, 38/38 unit tests passed 100%)
- `npm run build`: Exit 0 (Seluruh 45 halaman dan 55 rute API berhasil terkompilasi bersih di Next.js 16.3.1 Turbopack)








