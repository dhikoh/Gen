# PATCH NOTES — Prompt Gen

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

### Ringkasan Teknis

| Aspek | Status |
|-------|--------|
| i18n parity (id ↔ en) | ✅ Parity terjaga (7 key baru) |
| Duplikasi komponen | ❌ Dieliminasi (0 duplicate UI) |
| Endpoint yang digunakan | `POST /api/tts/generate` |
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








