# PAKET PROMPT TEKNIS — Perbaikan Hasil Audit Rilis #92–#98

Dokumen ini berisi 19 prompt siap salin. Setiap prompt **berdiri sendiri** — tempel SATU prompt ke AI, kerjakan sampai "Kriteria Selesai" terpenuhi, baru lanjut ke prompt berikutnya.

Semua temuan di dalamnya sudah diverifikasi dengan menjalankan kode, bukan sekadar membaca. Bila instruksi dan kondisi nyata berbeda, **berhenti dan laporkan**, jangan menebak.

---

## ATURAN GLOBAL — WAJIB TEMPEL DI SETIAP PROMPT

Kamu bekerja di proyek Next.js 16 (App Router) + React 19 + TypeScript strict + Tailwind + Prisma + next-intl.

**Lokasi proyek (ada spasi di nama folder, SELALU pakai tanda kutip):**

```
$PROJ = "C:/Users/Dhiko Herlambang/.gemini/antigravity/playground/pulsing-pinwheel/Project/Prompt Gen"
```

**Perintah verifikasi — gunakan persis seperti ini, jangan pakai `npx`:**

```bash
cd "$PROJ"
./node_modules/.bin/tsc --noEmit                    # cek tipe, exit 0 = bersih
./node_modules/.bin/eslint . --max-warnings=0       # cek lint, exit 0 = bersih
./node_modules/.bin/vitest run                      # cek test, semua harus passed
node scripts/audit-i18n.mjs                         # parity bahasa, exit 0 = bersih
node scripts/audit-design.mjs                       # token desain, exit 0 = bersih
npm run build                                       # build produksi, exit 0 = bersih
```

**ATURAN KERJA (melanggar = pekerjaan ditolak):**

1. Kerjakan **hanya** file yang disebut di bagian "File yang diubah". Jangan refactor file lain.
2. Jangan menambah dependensi npm kecuali secara eksplisit diminta.
3. Jangan mengubah perilaku yang tidak disebut instruksi, walau kamu rasa itu "lebih benar".
4. Jangan mengubah file `tests/**` atau `src/lib/__tests__/**` kecuali instruksi meminta menambah/mengubah test tertentu.
5. Setelah selesai, jalankan **SEMUA** perintah verifikasi di atas. Exit code harus 0.
6. Jangan pernah commit. Jangan jalankan `git add`, `git commit`, `git push`.
7. Jika satu perintah verifikasi gagal dan penyebabnya bukan perubahanmu, **berhenti dan laporkan** — jangan "memperbaiki" hal lain.
8. Laporkan ringkasan: daftar file yang diubah, hasil setiap perintah verifikasi, dan hal yang tidak bisa kamu selesaikan.

---

# BAGIAN A — PRIORITAS 0 (Fitur rusak total, kerjakan berurutan)

---

## PROMPT-01 — Paket ZIP Remotion tidak bisa di-render

### Konteks

Fitur "Unduh Paket Render (.zip)" (rilis #98) menghasilkan proyek Remotion mandiri. Saat ini `package.json` proyek yang dihasilkan hanya mencantumkan `remotion`. Fakta dari registry npm: paket `remotion` **tidak memiliki field `bin`**. Hanya `@remotion/cli` yang menyediakan executable bernama `remotion`. Akibatnya `render.bat`, `render.sh`, `npm run build`, dan `remotion.config.ts` (yang meng-`import "@remotion/cli/config"`) semuanya gagal setelah `npm install`. ZIP yang diunduh adalah proyek mati.

### File yang diubah

- `src/lib/remotionZipExporter.ts`

### Perintah

Buka `src/lib/remotionZipExporter.ts`. Cari objek `package.json` di sekitar baris 44–57 yang isinya kira-kira:

```ts
const packageJson = JSON.stringify(
  {
    name: "remotion-video-project",
    version: "1.0.0",
    private: true,
    scripts: {
      build: `remotion render ${componentName} out.mp4`,
      preview: "remotion preview src/index.ts",
      "render:win": "remotion.config.ts",
    },
    dependencies: {
      remotion: "^4.0.0",
    },
    devDependencies: {
      typescript: "^5.0.0",
      "@types/react": "^18.0.0",
    },
  },
  null,
  2,
);
```

Ganti SELURUH objek tersebut dengan versi berikut. Perhatikan: **nilai versi `remotion` dan `@remotion/cli` HARUS identik persis** (tanpa tanda `^`), karena Remotion akan error "Package versions must be identical" bila ada selisih versi antar-paketnya.

```ts
const REMOTION_VERSION = "4.0.536";

const packageJson = JSON.stringify(
  {
    name: "remotion-video-project",
    version: "1.0.0",
    private: true,
    scripts: {
      build: `remotion render src/index.ts ${componentName} out/video.mp4`,
      preview: "remotion preview src/index.ts",
    },
    dependencies: {
      remotion: REMOTION_VERSION,
    },
    devDependencies: {
      "@remotion/cli": REMOTION_VERSION,
      typescript: "^5.0.0",
      "@types/react": "^18.0.0",
    },
  },
  null,
  2,
);
```

Catatan perubahan pada `scripts.build`: argumen `remotion render` yang benar adalah `remotion render <entry-point> <composition-id> <output>`. Versi lama hanya memberi `<composition-id> <output>` tanpa entry point, sehingga juga salah.

Tambahkan `REMOTION_VERSION` tepat di atas fungsi pembuat `packageJson`, di level modul (bukan di dalam fungsi), agar mudah ditemukan nanti.

### Verifikasi

```bash
cd "$PROJ"
./node_modules/.bin/vitest run src/lib/__tests__/remotionZipExporter.test.ts
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint . --max-warnings=0
```

### Kriteria Selesai

- Ketiga perintah exit 0.
- `package.json` di dalam ZIP memuat `"@remotion/cli"` dengan versi identik dengan `"remotion"`.
- `scripts.build` memuat tiga argumen (`src/index.ts`, nama komponen, path output).

### DILARANG

- Mengubah file lain di dalam ZIP (src/index.ts, src/Video.tsx, remotion.config.ts, render.bat, render.sh).
- Mengubah versi `remotion` yang dipakai di luar objek ini.

---

## PROMPT-02 — Ekstensi file audio di ZIP salah (.mp3 berisi data WAV)

### Konteks

`src/lib/geminiTts.ts` selalu menghasilkan audio WAV (fungsi `pcmToWav`). Namun nama file audio yang ditulis ke proyek ZIP memakai ekstensi `.mp3`. Audio dengan ekstensi `.mp3` yang sebenarnya berisi data WAV akan gagal dimuat oleh sebagian pemutar dan membingungkan pengguna. Lebih parah: test yang ada justru mengunci kesalahan ini dengan meng-`expect` literal `.mp3`, sehingga gerbang lulus tanpa mendeteksi masalah.

### File yang diubah

- `src/lib/remotionPromptBuilder.ts`
- `src/lib/remotionZipExporter.ts`
- `src/lib/__tests__/remotionZipExporter.test.ts`

### Perintah

**(a)** Buka `src/lib/remotionPromptBuilder.ts`. Cari fungsi lokal `audioPath` di sekitar baris 144:

```ts
const audioPath = (audio: string, index: number) =>
  audio.startsWith("data:audio/")
    ? `audio/scene-${index}.mp3`
    : extractAudioPath(audio) || `audio/scene-${index}.mp3`;
```

Ganti `.mp3` menjadi `.wav` pada KEDUA kemunculan, hasilnya:

```ts
const audioPath = (audio: string, index: number) =>
  audio.startsWith("data:audio/")
    ? `audio/scene-${index}.wav`
    : extractAudioPath(audio) || `audio/scene-${index}.wav`;
```

**(b)** Buka `src/lib/remotionZipExporter.ts`. Cari baris sekitar 92 yang menulis file audio ke ZIP:

```ts
zip.file(`public/audio/scene-${scene.sceneNumber}.mp3`, scene.audio);
```

Ubah ekstensinya menjadi `.wav`.

**(c)** Buka `src/lib/__tests__/remotionZipExporter.test.ts`. Cari baris sekitar 48 yang berbunyi:

```ts
expect(zip.file("public/audio/scene-1.mp3")).not.toBeNull();
expect(zip.file("public/audio/scene-2.mp3")).not.toBeNull();
```

Test ini salah karena mengunci ekstensi literal. Ganti dengan pengujian yang menurut **tipe konten**, sehingga test tetap benar walau nama file berubah:

```ts
    it("menulis file audio untuk scene yang punya audio", () => {
      const audio = "data:audio/wav;base64,QUJDREVGRw==";
      const audioMap = new Map<number, { audio: string; hasAudio: true }>();
      audioMap.set(1, { audio, hasAudio: true });
      const zip = createRemotionZip(timeline, audioMap, opts);

      const scene1Audio = zip.file("public/audio/scene-1.wav");
      expect(scene1Audio).not.toBeNull();
      // Verifikasi isi file memang data audio, bukan file kosong.
      expect(zip.file("public/audio/scene-1.wav")!.asUint8array().length).toBeGreaterThan(0);
      // Scene 2 tidak punya audio, file-nya tidak boleh dibuat.
      expect(zip.file("public/audio/scene-2.wav")).toBeNull();
    });
```

Catatan: pastikan penulisan `audioMap` di test menyalin pola yang sudah ada (helper dummy audio), jangan ubah logika test lain.

**(d)** Perbarui juga teks di `src/lib/remotionPromptBuilder.ts` bila ada string literal `scene-N.mp3` lain yang muncul di dalam template prompt (cari dengan: `grep -n "scene-.*\.mp3" src/lib/remotionPromptBuilder.ts`). Bila ada, ubah ke `.wav`. Bila ternyata tidak ada, laporkan "tidak ditemukan" — jangan membuat perubahan yang tidak perlu.

### Verifikasi

```bash
cd "$PROJ"
./node_modules/.bin/vitest run src/lib/__tests__/remotionZipExporter.test.ts src/lib/__tests__/promptGenerator.remotion.test.ts
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint . --max-warnings=0
```

### Kriteria Selesai

- Tidak ada lagi `.mp3` yang menunjuk ke file audio hasil TTS di kedua file sumber. Jalankan untuk memastikan: `grep -rn "scene-.*\.mp3" src/` harus tidak menghasilkan output.
- Test file-audio lulus dengan menguji ekstensi `.wav`.

### DILARANG

- Mengubah `src/lib/geminiTts.ts`. Format keluaran TTS memang WAV dan itu benar.

---

## PROMPT-03 — Upload Google Drive dari Remotion Studio selalu gagal (client kirim FormData, server minta JSON)

### Konteks

`VideoTimelineTab` mengirim permintaan upload ke Google Drive sebagai JSON dengan field `base64Data` — dan itu benar sesuai kontrak server. `RemotionStudioTab` mengirim `FormData`. Server membaca body dengan `req.json()`, sehingga body FormData gagal di-parse, `body` menjadi `null`, validasi Zod gagal, dan request selalu dibalas 400. Tombol "Simpan ke Google Drive" di Remotion Studio tidak pernah berhasil.

### File yang diubah

- `src/components/remotion/RemotionStudioTab.tsx`

### Perintah

Buka `src/components/remotion/RemotionStudioTab.tsx`. Cari fungsi `handleUploadToDrive` di sekitar baris 281–318. Bagian yang salah adalah blok fetch ini (sekitar baris 293–305):

```ts
      const formData = new FormData();
      formData.append("file", renderedResult.blob, renderedResult.filename);
      formData.append("mimeType", renderedResult.mimeType);
      formData.append("draftId", "remotion-export");

      const res = await fetch("/api/user/google-drive/upload", {
        method: "POST",
        body: formData,
      });
```

Ganti blok tersebut dengan kontrak JSON yang sama seperti yang dipakai `VideoTimelineTab`. Pertama, tambahkan helper `blobToBase64` di LEVEL MODUL (tepat di atas `export function RemotionStudioTab`), dengan kode persis berikut:

```ts
const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      const base64 = res.split(",")[1];
      if (base64) resolve(base64);
      else reject(new Error("Failed to convert blob to base64"));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
```

Kemudian ganti blok fetch di atas menjadi:

```ts
      const base64Data = await blobToBase64(renderedResult.blob);
      const res = await fetch("/api/user/google-drive/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: renderedResult.filename,
          mimeType: renderedResult.mimeType,
          base64Data,
        }),
      });
```

Jangan mengubah baris sebelumnya (`if (!canUploadToDrive)`) maupun blok penanganan respons setelahnya.

### Verifikasi

```bash
cd "$PROJ"
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint . --max-warnings=0
./node_modules/.bin/vitest run
```

### Kriteria Selesai

- `RemotionStudioTab.tsx` tidak lagi berisi `new FormData(` maupun `formData.append`.
- Seluruh verifikasi exit 0.
- `grep -n "blobToBase64" src/components/remotion/RemotionStudioTab.tsx` menunjukkan helper didefinisikan sekali dan dipanggil sekali.

### DILARANG

- Mengubah `src/app/api/user/google-drive/upload/route.ts`.
- Mengubah `src/components/video/VideoTimelineTab.tsx`.

---

## PROMPT-04 — Tiga dari empat tema Remotion me-render background hitam

### Konteks

`THEME_STYLES` menyimpan latar belakang sebagai string CSS gradien dengan hex, contoh `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`. Fungsi `parseGradientColors` memakai regex `[^0-9%]+?` untuk menangkap nama warna — pola itu tidak cocok dengan hex karena hex berisi digit. Hasilnya fungsi mengembalikan `null`, lalu `fillStyle` diisi dengan string gradien CSS yang bukan paint valid untuk `<canvas>`. Canvas diam-diam mengabaikannya dan memakai fillStyle sebelumnya, yaitu hitam.

Konsekuensinya tema `modern`, `cyberpunk`, dan `kinetic` semuanya berlatar hitam di preview browser dan di MP4 hasil render browser, sementara proyek ZIP menampilkan gradien aslinya. Hanya `documentary` (latar padat `#111111`) yang benar.

### File yang diubah

- `src/lib/remotionCanvasRenderer.ts`
- `src/lib/__tests__/remotionCanvasRenderer.test.ts`

### Perintah

**(a)** Buka `src/lib/remotionCanvasRenderer.ts`. Hapus fungsi `parseGradientColors` yang ada (sekitar baris 13–19) beserta regex-nya `GRADIENT_RE`. Ganti dengan implementasi berikut yang mem-parsing dengan benar: memecah isi gradien pada koma di kedalaman kurung nol, lalu mengambil token warna pertama dan kedua yang valid.

Tambahkan `export` pada `parseGradientColors` agar bisa diuji unit.

```ts
/** Regex yang mengenali warna valid untuk canvas. */
const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const COLOR_FUNCTION = /^(?:rgb|hsl)a?\([\s\S]*\)$/i;

function isCanvasColor(value: string): boolean {
  return HEX_COLOR.test(value) || COLOR_FUNCTION.test(value);
}

/**
 * Ambil warna pertama dan kedua dari string linear-gradient CSS.
 * Contoh yang didukung: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)".
 * Mengembalikan null bila bukan gradien dua warna.
 */
export function parseGradientColors(bg: string): [string, string] | null {
  const marker = "linear-gradient(";
  const start = bg.indexOf(marker);
  if (start === -1) return null;

  const open = start + marker.length;
  const close = bg.lastIndexOf(")");
  if (close <= open) return null;

  // Pecah isi gradien pada koma yang berada di kedalaman kurung 0,
  // sehingga "rgb(15, 23, 42)" tidak ikut terpotong.
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of bg.slice(open, close)) {
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current);

  const colors: string[] = [];
  for (const part of parts) {
    const stop = part.trim();
    if (!stop) continue;
    if (stop.startsWith("#")) {
      const token = stop.split(/\s+/)[0] ?? "";
      if (HEX_COLOR.test(token)) colors.push(token);
      continue;
    }
    const fn = stop.match(/^(?:rgb|hsl)a?\([\s\S]*?\)/);
    if (fn) {
      colors.push(fn[0]);
      continue;
    }
    const token = stop.split(/\s+/)[0] ?? "";
    if (isCanvasColor(token)) colors.push(token);
    if (colors.length >= 2) break;
  }

  return colors.length >= 2 ? [colors[0] as string, colors[1] as string] : null;
}
```

Perhatikan pada fungsi lama pemakaiannya ada di `src/lib/remotionCanvasRenderer.ts` baris 97, yaitu `const gradient = parseGradientColors(theme.background);` dengan `theme` berasal dari `THEME_STYLES[options.theme]`. Nilai pengembaliannya sekarang tetap bertipe `[string, string] | null` — sama seperti sebelumnya, jadi jangan ubah pemanggilnya.

**(b)** Buka `src/lib/__tests__/remotionCanvasRenderer.test.ts` dan TAMBAHKAN test baru (jangan mengubah test yang sudah ada) untuk mengunci perilaku ini:

```ts
import { parseGradientColors } from "../remotionCanvasRenderer";

describe("parseGradientColors", () => {
  it("mengambil warna hex dari linear-gradient", () => {
    expect(parseGradientColors("linear-gradient(135deg, #0f172a 0%, #1e293b 100%)")).toEqual([
      "#0f172a",
      "#1e293b",
    ]);
  });

  it("mengambil warna hex dari gradien tema cyberpunk", () => {
    expect(parseGradientColors("linear-gradient(135deg, #0a0014 0%, #1a0033 100%)")).toEqual([
      "#0a0014",
      "#1a0033",
    ]);
  });

  it("mendukung fungsi warna rgb dengan spasi", () => {
    expect(parseGradientColors("linear-gradient(90deg, rgb(15 23 42) 0%, rgb(30 41 59) 100%)")).toEqual([
      "rgb(15 23 42)",
      "rgb(30 41 59)",
    ]);
  });

  it("mengembalikan null untuk warna padat", () => {
    expect(parseGradientColors("#111111")).toBeNull();
  });
});
```

Pastikan `describe` dan `it` diimpor sesuai pola file test tersebut (cek baris atas file; biasanya sudah ada import dari `vitest`).

**(c)** Jalankan pemeriksaan menyeluruh terhadap pemakaian lain agar tidak ada yang tertinggal:

```bash
grep -rn "GRADIENT_RE\|parseGradientColors" src/
```

Bila `GRADIENT_RE` masih dipakai di file lain, hentikan dan laporkan. Bila hanya dipakai di `remotionCanvasRenderer.ts`, penghapusan aman.

### Verifikasi

```bash
cd "$PROJ"
./node_modules/.bin/vitest run src/lib/__tests__/remotionCanvasRenderer.test.ts
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint . --max-warnings=0
```

### Kriteria Selesai

- Test baru lulus (keempatnya).
- Tidak ada lagi referensi ke `GRADIENT_RE`.
- `grep -n "export function parseGradientColors" src/lib/remotionCanvasRenderer.ts` menunjukkan fungsi sudah ter-`export`.

### DILARANG

- Mengubah nilai warna di `THEME_STYLES` / `remotionPromptBuilder.ts`.
- Mengubah pemanggilan `parseGradientColors` di dalam fungsi `renderRemotionFrame`.

---

## PROMPT-05 — Samakan ekspektasi fitur "Code-as-Video" (kode TSX hasil AI tidak pernah dieksekusi)

### Konteks

Rilis #98 menyebut video dirender dari kode. Kenyataannya kode TSX hasil AI hanya melewati validator lalu bisa diunduh; preview browser, MP4 hasil render browser, dan proyek ZIP semuanya memakai template kartu-teks yang sudah ditentukan dan **mengabaikan field `visualPrompt`**. Ketiga jalur itu konsisten satu sama lain, tetapi tidak satu pun mengeksekusi kode AI.

Ini keputusan produk, bukan bug teknis. Tugasnya adalah membuat ekspektasi di UI dan di catatan rilis jujur terhadap apa yang benar-benar dilakukan.

**Jalur yang dipilih: OPSI A — koreksi ekspektasi, bukan implementasi.**

### File yang diubah

- `messages/id.json`
- `messages/en.json`
- `src/components/remotion/RemotionStudioTab.tsx`
- `PATCH_NOTES.md`

### Perintah

**(a)** Buka `messages/id.json`. Cari objek namespace `"RemotionStudio"`. TAMBAHKAN dua key baru di akhir objek itu (tepat sebelum kurung tutup):

```json
      "templateNoticeTitle": "Yang dihasilkan adalah template motion design",
      "templateNoticeBody": "Kode TSX hanya diekspor untuk dipakai di proyek Remotion Anda sendiri. Preview, render MP4 di browser, dan paket ZIP memakai template kartu teks yang sudah ditentukan, bukan hasil eksekusi kode TSX."
```

**(b)** Buka `messages/en.json`, cari objek `"RemotionStudio"`, tambahkan dua key yang sama dengan nilai berbahasa Inggris:

```json
      "templateNoticeTitle": "What is produced is a motion design template",
      "templateNoticeBody": "The TSX code is only exported for use in your own Remotion project. The browser preview, in-browser MP4 render, and ZIP package use a predefined text-card template rather than executing the TSX code."
```

Sesuaikan penulisan koma dengan gaya file JSON tersebut (jangan tinggalkan koma ganda atau koma menggantung).

**(c)** Buka `src/components/remotion/RemotionStudioTab.tsx`. Cari bagian sub-tab `boilerplate` — yaitu tempat teks `boilerplateHint` dirender. Tambahkan sebuah panel peringatan di ATAS elemen yang menampilkan kode, dengan gaya dan pola yang sama seperti panel lain di file itu (cek dulu bagaimana panel ditulis; jangan membuat gaya baru). Contoh struktur:

```tsx
        <div className="pg-border rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-600">
            {t("templateNoticeTitle")}
          </p>
          <p className="text-sm text-amber-600/90">{t("templateNoticeBody")}</p>
        </div>
```

Pastikan pemanggilan `t` yang dipakai sudah sesuai dengan cara file itu memakai `useTranslations("RemotionStudio")`. Jika ternyata di file itu memakai `t("RemotionStudio.templateNoticeTitle")`, ikuti pola yang ada.

**(d)** Buka `PATCH_NOTES.md`. Cari judul rilis **[#98]**. Perbarui bagian deskripsi yang menjanjikan render video dari kode. Ubah kalimat menjadi klaim yang benar: yang dirender adalah template motion design berbasis teks; kode TSX hanya diekspor. **Jangan menghapus riwayat rilis lain.** Jangan mengubah judul atau nomor rilis.

### Verifikasi

```bash
cd "$PROJ"
node scripts/audit-i18n.mjs
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint . --max-warnings=0
./node_modules/.bin/vitest run
```

### Kriteria Selesai

- `audit-i18n.mjs` exit 0 (kedua bahasa punya key yang sama dan jumlah key sama).
- Kedua key baru muncul di `id.json` dan `en.json`.
- `PATCH_NOTES.md` bagian #98 tidak lagi menjanjikan eksekusi kode TSX.
- Seluruh verifikasi exit 0.

### DILARANG

- Menambahkan mekanisme eksekusi kode (iframe, worker, bundler, dsb).
- Mengubah `buildRemotionBoilerplate` atau `adaptTimeline` di `src/lib/remotionPromptBuilder.ts`.
- Mengubah rilis #92–#97 di `PATCH_NOTES.md`.

---

# BAGIAN B — PRIORITAS 1 (Keamanan, workflow, inkonsistensi)

---

## PROMPT-06 — Masukkan seluruh suite test dan skrip audit ke git

### Konteks

`.gitignore` memuat entri `/tests/` dan `/scripts/`. Akibatnya 17 file test di `tests/` dan dua skrip audit (`scripts/audit-i18n.mjs`, `scripts/audit-design.mjs`) tidak pernah ter-commit. `git ls-files tests` menghasilkan output kosong. Catatan rilis #98 menyebut "7 gerbang verifikasi lulus", tetapi gerbang itu tidak bisa dijalankan siapa pun yang meng-clone repo karena filenya tidak ada. Ini risiko regresi paling mahal di antara semua temuan.

### File yang diubah

- `.gitignore`

### Perintah

Buka `.gitignore` di root proyek. Cari dan HAPUS dua baris berikut (persis, termasuk garis miring di awal):

```
/tests/
/scripts/
```

Jangan mengubah baris `.env*` atau baris lainnya.

### Verifikasi

```bash
cd "$PROJ"
git status --porcelain | head -40
git check-ignore -v tests/parsers.test.ts scripts/audit-i18n.mjs
```

`git check-ignore` harus TIDAK menghasilkan output apa pun (artinya file itu tidak lagi diabaikan).

### Kriteria Selesai

- `grep -n "tests" .gitignore` tidak lagi menunjukkan `/tests/`.
- `git status --porcelain` menampilkan `tests/` dan `scripts/` sebagai file baru (untracked).
- `git ls-files tests | wc -l` masih 0 karena belum di-commit — itu wajar, karena kamu DILARANG commit.

### DILARANG

- Menjalankan `git add`, `git commit`, atau `git push`.
- Menambahkan entri `.gitignore` lain, termasuk `node_modules` (sudah ada).

---

## PROMPT-07 — Route export storyboard lolos gerbang hak akses

### Konteks

`src/lib/storyboardAccess.ts` menyediakan `checkStoryboardAccess()` yang memeriksa tiga hal berurutan: pengguna sudah login, langganan aktif, dan flag `storyboardStudio` aktif. Fungsi itu sudah dipakai di `src/app/api/drafts/[id]/storyboard/route.ts` dan `src/app/api/drafts/[id]/storyboard/panels/route.ts`. Tetapi `src/app/api/drafts/[id]/storyboard/export/route.ts` hanya memanggil `storyboardError()` yang hanya memeriksa login. Akibatnya pengguna paket non-premium bisa mengunduh ZIP storyboard penuh.

### File yang diubah

- `src/app/api/drafts/[id]/storyboard/export/route.ts`

### Perintah

Buka file tersebut. Saat ini bagiannya kira-kira:

```ts
import { NextResponse } from "next/server";
import JSZip from "jszip";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { storyboardError, STORYBOARD_DEFAULTS } from "@/lib/storyboardAccess";
import { generateStoryboardImagePrompt } from "@/lib/storyboardAiHelpers";
import { sanitizeStoryboardSceneList } from "@/lib/parsers";
```

dan

```ts
  const user = await getCurrentUser();
  if (!user) return storyboardError("unauthorized", "UNAUTHORIZED");

  const { id: draftId } = await params;
```

**(a)** Ubah baris import agar memuat `checkStoryboardAccess`:

```ts
import {
  storyboardError,
  checkStoryboardAccess,
  STORYBOARD_DEFAULTS,
} from "@/lib/storyboardAccess";
```

**(b)** Ganti dua baris `const user = ...` dan `if (!user) ...` di atas menjadi:

```ts
  const access = await checkStoryboardAccess();
  if (!access.ok) return storyboardError(access.errorKey);
  const userId = access.userId;
```

**(c)** Setelah itu, seluruh pemakaian `user.id` di dalam file harus diganti menjadi `userId`. Jalankan:

```bash
grep -n "user\.id\|user!" "src/app/api/drafts/[id]/storyboard/export/route.ts"
```

Ubah setiap kecocokan menjadi `userId`. Jangan mengubah variabel lain.

**(d)** Verifikasi tidak ada pemakaian `getCurrentUser` yang tersisa yang kini jadi tidak terpakai:

```bash
grep -n "getCurrentUser" "src/app/api/drafts/[id]/storyboard/export/route.ts"
```

Bila tidak ada pemakaian lain, hapus import `getCurrentUser` agar lint tidak gagal karena unused import.

### Verifikasi

```bash
cd "$PROJ"
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint . --max-warnings=0
./node_modules/.bin/vitest run
```

### Kriteria Selesai

- File export memanggil `checkStoryboardAccess()` dan mengembalikan `storyboardError(access.errorKey)` bila gagal.
- Tidak ada lagi pemakaian `getCurrentUser` yang tidak terpakai.
- Seluruh verifikasi exit 0.

### DILARANG

- Mengubah `src/lib/storyboardAccess.ts`.
- Mengubah dua route storyboard lain yang sudah benar.

---

## PROMPT-08 — Refactor efek timeline: berhenti memanggil `/api/used-titles` setiap kali TTS selesai

### Konteks

Di `ScenePromptStudioClient.tsx` ada `useEffect` yang membangun `currentTimeline`. `audioMap` ada di dalam daftar dependency-nya. `audioMap` dibuat sebagai objek baru setiap kali `ttsResults` berubah, sehingga identitasnya selalu berbeda. Akibatnya setiap kali satu scene selesai di-generate TTS, seluruh timeline dibangun ulang DAN fetch `/api/used-titles` dijalankan lagi. Dengan 120 scene, bisa terjadi 120x fetch. Endpoint itu punya rate limit 60 request per 60 detik, sehingga mulai menit kedua fetch mulai gagal 429 dan `usedTitleIds` hilang diam-diam karena error-nya ditelan `catch`.

### File yang diubah

- `src/app/[locale]/dashboard/scene-prompt/ScenePromptStudioClient.tsx`

### Perintah

**(a)** Cari blok `useEffect` yang memuat `buildTimeline(` (sekitar baris 632–697). Catat isi lengkapnya.

**(b)** Ganti seluruh blok `useEffect` tersebut dengan dua `useEffect` berikut. Perhatikan: `audioMap` tetap dipakai di efek kedua, tetapi fetch judul sudah dipindahkan ke efek pertama yang hanya bergantung pada `selectedChannelId`.

```tsx
  // Sumber data judul terpakai. Diambil SEKALI per channel, bukan setiap TTS selesai.
  const [usedTitles, setUsedTitles] = useState<{ ids: string[]; texts: string[] }>({
    ids: [],
    texts: [],
  });

  useEffect(() => {
    if (!selectedChannelId) {
      setUsedTitles({ ids: [], texts: [] });
      return;
    }
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/used-titles?channelId=${selectedChannelId}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const titles = (await res.json()) as { id: string; title: string }[];
          setUsedTitles({
            ids: titles.map((item) => item.id),
            texts: titles.map((item) => item.title),
          });
        }
      } catch {
        if (!controller.signal.aborted) setUsedTitles({ ids: [], texts: [] });
      }
    })();
    return () => controller.abort();
  }, [selectedChannelId]);

  useEffect(() => {
    if (scenes.length === 0) {
      setCurrentTimeline(null);
      return;
    }
    const tl = buildTimeline(scenes as SceneForExport[], {
      draftId: initialDraft?.id ?? "",
      channelId: selectedChannelId ?? null,
      usedTitleIds: usedTitles.ids,
      usedTitleTexts: usedTitles.texts,
      defaultDurationSec: 4,
    });
    if (audioMap.size > 0) {
      tl.scenes = tl.scenes.map((s) => ({
        ...s,
        audioRef: audioMap.get(s.sceneNumber) ?? null,
      }));
    }
    setCurrentTimeline(tl);
  }, [scenes, initialDraft?.id, selectedChannelId, audioMap, usedTitles]);
```

**(c)** Periksa apakah masih ada pemakaian lama yang kini jadi usang:

```bash
grep -n "usedTitleIds\|usedTitleTexts\|/api/used-titles" "src/app/[locale]/dashboard/scene-prompt/ScenePromptStudioClient.tsx"
```

- `usedTitleIds` / `usedTitleTexts` sekarang hanya boleh muncul di dalam objek opsi `buildTimeline`.
- `/api/used-titles` sekarang hanya boleh muncul SATU kali, di dalam efek pertama.
- Bila ada pemakaian lain, hentikan dan laporkan sebelum mengubah lebih jauh.

**(d)** Periksa impor `useState` sudah ada (file ini sudah memakai `useState` untuk `scenes`, jadi hampir pasti sudah diimpor).

### Verifikasi

```bash
cd "$PROJ"
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint . --max-warnings=0
./node_modules/.bin/vitest run
```

### Kriteria Selesai

- `grep -c "/api/used-titles"` menghasilkan 1.
- Seluruh verifikasi exit 0.

### DILARANG

- Mengubah `src/app/api/used-titles/route.ts`.
- Mengubah `buildTimeline` di `src/lib/timelineBuilder.ts`.
- Mengubah pemanggilan TTS atau struktur `audioMap`.

---

## PROMPT-09 — Ekstrak hook upload Google Drive bersama, dan jangan retry pada status 4xx

### Konteks

Ada tiga salinan kode upload ke Google Drive yang hampir sama: dua di `VideoTimelineTab.tsx` (video dan audio) dan satu di `RemotionStudioTab.tsx`. `blobToBase64` dan loop retry diduplikasi. Selain itu loop retry mengulang request untuk status 400, 401, dan 403 — padahal status itu menandakan masalah permanen, bukan gangguan sementara. Retry atas 403 "fitur terkunci" membuang waktu; retry atas 429 justru memperparah throttling.

### File yang diubah

- `src/hooks/useDriveUpload.ts` (file baru)
- `src/components/video/VideoTimelineTab.tsx`
- `src/components/remotion/RemotionStudioTab.tsx`

### Perintah

**(a)** Buat file baru `src/hooks/useDriveUpload.ts` dengan isi:

```ts
"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

const MAX_RETRIES = 3;

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      const base64 = res.split(",")[1];
      if (base64) resolve(base64);
      else reject(new Error("Failed to convert blob to base64"));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface DriveUploadResult {
  fileUrl: string;
  fileId: string;
}

export function useDriveUpload() {
  const t = useTranslations("VideoStudio");
  const [isUploading, setIsUploading] = useState(false);
  const [driveUrl, setDriveUrl] = useState<string | null>(null);

  const upload = useCallback(
    async (blob: Blob, filename: string): Promise<boolean> => {
      setIsUploading(true);
      try {
        const base64Data = await blobToBase64(blob);

        let lastError: unknown = null;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          try {
            const res = await fetch("/api/user/google-drive/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                filename,
                mimeType: blob.type || "video/webm",
                base64Data,
              }),
            });

            // Hanya status yang bisa berubah saat dicoba ulang yang di-retry.
            // 400/401/403 adalah masalah permanen: gagal sekarang juga nanti.
            const isRetryable =
              res.status === 429 || (res.status >= 500 && res.status < 600);

            if (res.ok) {
              const data = (await res.json()) as DriveUploadResult;
              setDriveUrl(data.fileUrl);
              return true;
            }

            const errorBody = (await res.json().catch(() => null)) as
              | { error?: string }
              | null;
            lastError = new Error(
              errorBody?.error ?? `HTTP ${res.status}: ${res.statusText}`,
            );

            if (!isRetryable) break;

            const retryAfter = Number(res.headers.get("Retry-After"));
            const waitTime = Number.isFinite(retryAfter) && retryAfter > 0
              ? retryAfter * 1000
              : 2000 * Math.pow(2, attempt);
            await sleep(waitTime);
          } catch (err) {
            lastError = err;
            // Gagal di level jaringan (offline, DNS, dsb) masih layak dicoba ulang.
            if (attempt === MAX_RETRIES - 1) break;
            await sleep(2000 * Math.pow(2, attempt));
          }
        }

        if (lastError) console.error("Upload to Drive failed:", lastError);
        return false;
      } finally {
        setIsUploading(false);
      }
    },
    [t],
  );

  return { isUploading, driveUrl, setDriveUrl, uploadToDrive: upload };
}
```

**(b)** Buka `src/components/video/VideoTimelineTab.tsx`. Perlu diketahui: file ini memuat DUA komponen, masing-masing punya `const t = useTranslations("VideoStudio")` (baris 32 dan 779). Pastikan perubahan dilakukan pada komponen yang memuat handler upload yang kamu ubah.

Hapus `blobToBase64` dan `sleep` yang didefinisikan di dalam file itu, dan hapus SEMUA logika `fetch("/api/user/google-drive/upload", ...)` beserta loop retry-nya (dua tempat: upload video dan upload audio). Ganti pemakaiannya dengan hook. Contoh untuk upload video:

```tsx
const { isUploading: isUploadingDrive, driveUrl, uploadToDrive } = useDriveUpload();

// ... di dalam handler:
const success = await uploadToDrive(renderedResult.blob, renderedResult.filename);
if (!success) {
  setError(t("uploadDriveFailed"));
  return;
}
setSuccess(t("uploadDriveSuccess"));
```

Lakukan hal serupa untuk upload audio, dengan nama file yang sesuai dan state upload-nya sendiri.

**(c)** Buka `src/components/remotion/RemotionStudioTab.tsx`. Ganti fungsi `handleUploadToDrive` agar memakai hook yang sama:

```tsx
const { isUploading: isUploadingToDrive, driveUrl, uploadToDrive } = useDriveUpload();

const handleUploadToDrive = useCallback(async () => {
  if (!canUploadToDrive) return;
  if (!renderedResult) return;

  const ok = await uploadToDrive(renderedResult.blob, renderedResult.filename);
  if (!ok) {
    setError(t("uploadDriveFailed"));
    return;
  }
  setSuccess(t("uploadDriveSuccess"));
}, [canUploadToDrive, renderedResult, uploadToDrive, setError, setSuccess, t]);
```

Perhatikan: hook sudah menangani `isUploading` dan `driveUrl`, jadi hapus state lokal `isUploadingToDrive` dan `driveUrl` yang lama bila sudah dideklarasikan di komponen. Hapus juga `blobToBase64` bila ada.

**(d)** Pastikan `error` dan `success` di kedua komponen dibersihkan saat memulai upload (panggil `setError(null); setSuccess(null);`) sebelum memanggil `uploadToDrive`, persis seperti perilaku lama.

**(e)** Jalankan pemeriksaan sisa duplikasi:

```bash
grep -rn "blobToBase64" src/
grep -rn "user/google-drive/upload" src/
```

`blobToBase64` hanya boleh ada di `src/hooks/useDriveUpload.ts`. URL endpoint hanya boleh ada di hook tersebut.

### Verifikasi

```bash
cd "$PROJ"
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint . --max-warnings=0
./node_modules/.bin/vitest run
```

### Kriteria Selesai

- Duplikasi hilang: satu definisi `blobToBase64`, satu panggilan fetch ke endpoint upload.
- Retry hanya untuk 429 dan 5xx, dengan menghormati header `Retry-After`.
- Seluruh verifikasi exit 0.

### DILARANG

- Mengubah `src/app/api/user/google-drive/upload/route.ts`.
- Mengubah perilaku tombol, teks pesan, atau fitur lain di kedua komponen.

---

## PROMPT-10 — String hardcoded di API Google Drive + pesan ukuran file yang menyesatkan

### Konteks

Rilis #89 menegakkan aturan "zero hardcoded strings" dan `src/lib/apiI18n.ts` menyediakan `getApiTranslator()` dengan namespace `API`. Tetapi `src/app/api/user/google-drive/upload/route.ts` masih memuat dua kalimat Indonesia literal. Selain itu pesan `fileTooLarge` yang dipakai untuk batas 100 MB berbunyi "Ukuran file terlalu besar. Maksimal 2MB." — menyesatkan pengguna.

### File yang diubah

- `messages/id.json`
- `messages/en.json`
- `src/app/api/user/google-drive/upload/route.ts`

### Perintah

**(a)** Buka `messages/id.json`. Cari objek namespace `"API"`. Tambahkan tiga key baru:

```json
      "googleDriveLocked": "Fitur Google Drive memerlukan upgrade paket Anda.",
      "googleDriveNotConnected": "Akun Google Drive belum terhubung. Silakan hubungkan akun Anda terlebih dahulu.",
      "driveFileTooLarge": "Ukuran file terlalu besar. Maksimal 100MB."
```

**(b)** Buka `messages/en.json`, objek `"API"`, tambahkan tiga key yang sama dalam bahasa Inggris:

```json
      "googleDriveLocked": "The Google Drive feature requires a plan upgrade.",
      "googleDriveNotConnected": "Your Google Drive account is not connected yet. Please connect your account first.",
      "driveFileTooLarge": "File is too large. Maximum 100MB."
```

**(c)** Buka `src/app/api/user/google-drive/upload/route.ts`. Ubah tiga tempat:

1. `t("imageStudioLocked")` → `t("googleDriveLocked")`
2. `t("fileTooLarge")` → `t("driveFileTooLarge")`
3. `return NextResponse.json({ error: "Google Drive belum terhubung" }, { status: 400 });` → `return NextResponse.json({ error: t("googleDriveNotConnected") }, { status: 400 });`

**(d)** Jalankan pemeriksaan agar tidak ada string literal yang tertinggal di file ini:

```bash
grep -nE '"[^"]*[A-Za-z]{4,} [A-Za-z]{4,}[^"]*"' src/app/api/user/google-drive/upload/route.ts
```

Setiap hasil yang berupa kalimat manusia (bukan nama simbol, path, header, atau MIME type) harus dikonversikan. Bila ragu, laporkan hasilnya sebelum mengubah.

### Verifikasi

```bash
cd "$PROJ"
node scripts/audit-i18n.mjs
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint . --max-warnings=0
./node_modules/.bin/vitest run
```

### Kriteria Selesai

- `audit-i18n.mjs` exit 0 dengan jumlah key yang sama di kedua bahasa.
- Tidak ada lagi string kalimat literal di route tersebut.
- Seluruh verifikasi exit 0.

### DILARANG

- Mengubah pesan `fileTooLarge` yang lama (dipakai route lain untuk batas 2 MB, jadi pesan lama masih benar di sana).

---

## PROMPT-11 — Batasi penggunaan memori pada upload Google Drive

### Konteks

Route upload menerima base64 sepanjang 140 juta karakter di dalam memori, melakukan `req.json()` yang memuat seluruh body, lalu `Buffer.from` yang menyalinnya lagi. Tidak ada pemeriksaan `Content-Length` sebelum body dibaca. Dengan rate limit 5 request per 60 detik per user, ini bisa mencapai sekitar 1 GB memori transien. Field `mimeType` juga diterima apa adanya.

### File yang diubah

- `src/app/api/user/google-drive/upload/route.ts`

### Perintah

**(a)** Di paling atas fungsi `POST`, sebelum `req.json()`, tambahkan pemeriksaan header:

```ts
  const contentLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES * 1.4) {
    return NextResponse.json({ error: t("driveFileTooLarge") }, { status: 413 });
  }
```

Buat konstanta berikut di level modul (di atas fungsi):

```ts
/** Batas upload dalam byte. Base64 memuai ~33%, jadi batas karakter dihitung dari sini. */
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const MAX_BASE64_CHARS = Math.floor(MAX_UPLOAD_BYTES * 1.34);
```

**(b)** Ganti batas karakter yang sekarang hardcoded (sekitar baris 76) menjadi pemakaian konstanta:

```ts
  if (!body.base64Data || body.base64Data.length > MAX_BASE64_CHARS) {
    return NextResponse.json({ error: t("driveFileTooLarge") }, { status: 413 });
  }
```

**(c)** Setelah payload valid, tambahkan whitelist `mimeType` sebelum dipakai mengunggah ke Drive:

```ts
  const ALLOWED_MIME_TYPES = new Set([
    "video/webm",
    "video/mp4",
    "video/quicktime",
    "audio/wav",
    "audio/mpeg",
    "image/png",
    "image/jpeg",
    "image/webp",
  ]);
```

dan

```ts
  if (!ALLOWED_MIME_TYPES.has(body.mimeType)) {
    return NextResponse.json({ error: t("invalidData") }, { status: 400 });
  }
```

**(d)** Kurangi duplikasi pemanggilan `getDriveClient(userId)` — panggil sekali dan gunakan hasilnya untuk semua operasi upload dan pembuatan link.

### Verifikasi

```bash
cd "$PROJ"
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint . --max-warnings=0
./node_modules/.bin/vitest run
```

### Kriteria Selesai

- `Content-Length` diperiksa sebelum `req.json()`.
- `mimeType` divalidasi whitelist.
- `getDriveClient` dipanggil sekali per request.
- Seluruh verifikasi exit 0.

### DILARANG

- Mengubah endpoint, response schema (`fileUrl`, `fileId`), atau status code lain.
- Mengubah konfigurasi rate limit.

---

## PROMPT-12 — Perketat sandbox dan keamanan header

### Konteks

Rilis #96 menyatakan animasi berjalan di sandbox tanpa akses jaringan. Kenyataannya CSP di `next.config.ts` mengizinkan `connect-src 'self' https:` dan `img-src ... https:`. Karena `srcdoc` iframe mewarisi CSP dari dokumen induk, kode animasi bisa mengirim data keluar runtime lewat `img.src = "https://..."`, yang tidak tertangkap validasi regex statis. Selain itu tidak ada header `Strict-Transport-Security` sama sekali, padahal aplikasi ini punya autentikasi dan alur pembayaran.

### File yang diubah

- `next.config.ts`
- `src/app/[locale]/dashboard/scene-prompt/page.tsx`

### Perintah

**(a)** Buka `next.config.ts`. Cari konfigurasi `Content-Security-Policy` (sekitar baris 44) yang isinya:

```
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' data: blob:",
      "connect-src 'self' https:",
      "frame-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
```

Perbaiki sebagai berikut:

- Ubah `"img-src 'self' data: blob: https:"` menjadi `"img-src 'self' data: blob:"`.
- Ubah `"connect-src 'self' https:"` menjadi `"connect-src 'self'"`.

**(b)** Tetapkan aturan CSP khusus untuk route scene-prompt di `src/app/[locale]/dashboard/scene-prompt/page.tsx`. Cari pemakaian `headers()` dan pola `return { "Content-Security-Policy": ... }` yang ada di file itu. Ubah nilai `img-src` dan `connect-src` pada route itu agar tetap mengizinkan sumber eksternal yang dibutuhkan oleh Next/Image dan API eksternal, sebagai berikut:

```
"img-src 'self' data: blob: https:",
"connect-src 'self' https:",
```

Jadi: nilai global di `next.config.ts` menjadi ketat, dan hanya route ini yang tetap longgar.

**(c)** Tambahkan header `Strict-Transport-Security`. Cari objek `securityHeaders` di `next.config.ts` dan tambahkan baris berikut SETELAH array `Content-Security-Policy`:

```ts
      "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
```

**(d)** Buka `src/components/video/AnimationRenderer.tsx`, cari listener `window.addEventListener("message", ...)` (sekitar baris 98). Tambahkan verifikasi sumber pesan sebagai baris pertama di dalam callback:

```ts
      if (event.source !== iframeRef.current?.contentWindow) return;
```

Lakukan hal yang sama pada listener `message` di `src/lib/videoAssembler.ts` (sekitar baris 21), memakai sumber window yang tersedia di konteks fungsi itu. Jika di sana tidak tersedia referensi ke elemen iframe, **berhenti dan laporkan** — jangan menebak.

### Verifikasi

```bash
cd "$PROJ"
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint . --max-warnings=0
./node_modules/.bin/vitest run
npm run build
```

### Kriteria Selesai

- `next.config.ts` memuat `Strict-Transport-Security`.
- Nilai global `img-src` dan `connect-src` tidak lagi mengandung `https:`.
- Kedua listener `message` memeriksa `event.source`.
- Seluruh verifikasi exit 0.

### DILARANG

- Mengubah `frame-src`, `script-src`, atau direktif lain.
- Menambahkan nonce, hash, atau mekanisme CSP baru.

---

## PROMPT-13 — Tambahkan tombol batal untuk render video di browser

### Konteks

`src/lib/remotionVideoAssembler.ts` (#98) sudah menerima opsi `signal?: AbortSignal`. `src/lib/videoAssembler.ts` (#96) belum. Keduanya melakukan render real-time berbasis wall-clock, sehingga video 600 detik mengunci pengguna selama 10 menit tanpa jalan keluar. `VideoTimelineTab` menampilkan progres tetapi tidak punya tombol batal.

### File yang diubah

- `src/lib/videoAssembler.ts`
- `src/components/video/VideoTimelineTab.tsx`

### Perintah

**(a)** Buka `src/lib/videoAssembler.ts`. Tambahkan `signal?: AbortSignal` pada opsi. Di dalam loop render, tambahkan pemeriksaan batalkan pada setiap iterasi:

```ts
    if (options.signal?.aborted) {
      throw new DOMException("Render dibatalkan", "AbortError");
    }
```

Tambahkan juga pemeriksaan serupa tepat setelah setiap `await new Promise(...)` yang menunggu frame berikutnya, sehingga pembatalan segera berefek.

**(b)** Buka `src/components/video/VideoTimelineTab.tsx`. Tambahkan `useRef<AbortController | null>` untuk menyimpan controller render, dan `useState<boolean>` untuk `isCancelled`.

Saat memulai render, buat controller dan teruskan `signal`-nya ke `assembleVideo` (atau fungsi render yang dipakai, cek namanya). Di dalam `finally`, setel controller menjadi `null`.

Tambahkan tombol batal yang hanya tampil saat sedang merender:

```tsx
        {isRendering && (
          <button type="button" onClick={cancelRender} className="...">
            {t("cancelRender")}
          </button>
        )}
```

Dengan:

```tsx
  const cancelRender = useCallback(() => {
    abortRef.current?.abort();
    setIsCancelled(true);
  }, []);
```

Tangani `AbortError` secara terpisah agar tidak memunculkan pesan galat generik: bila `err.name === "AbortError"`, jangan memanggil `setError(t("renderError"))`.

**(c)** Tambahkan key `cancelRender` ke `messages/id.json` dan `messages/en.json` pada namespace yang dipakai komponen ini. Cek dulu namespace-nya dengan melihat `useTranslations(...)` di file tersebut. Nilai Indonesia: `"Batal"`, nilai Inggris: `"Cancel"`.

### Verifikasi

```bash
cd "$PROJ"
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint . --max-warnings=0
node scripts/audit-i18n.mjs
./node_modules/.bin/vitest run
```

### Kriteria Selesai

- Tombol batal muncul hanya saat render berjalan.
- Membatalkan menghentikan loop render, menutup recorder, dan melepas `MediaRecorder`, tanpa pesan galat.
- Seluruh verifikasi exit 0.

### DILARANG

- Mengubah perilaku render ketika tidak dibatalkan.
- Mengubah `remotionVideoAssembler.ts` yang sudah benar.

---

# BAGIAN C — PRIORITAS 2 (Kualitas dan konsistensi)

---

## PROMPT-14 — Konsistenkan pelepasan object URL

### Konteks

Ada enam tempat yang memanggil `URL.revokeObjectURL(url)` tepat setelah `link.click()` atau `a.click()`, tanpa jeda. Bila browser belum sempat membaca stream-nya, unduhan bisa mati. `RemotionStudioTab.tsx` baris 94 sudah memakai pola aman dengan `setTimeout(..., 2000)`. Samakan polanya.

### File yang diubah

- `src/app/[locale]/dashboard/drafts/[id]/DraftActions.tsx`
- `src/app/[locale]/dashboard/scene-prompt/ScenePromptStudioClient.tsx`
- `src/components/generator/GeneratorForm.tsx`
- `src/components/video/VideoTimelineTab.tsx`

### Perintah

**(a)** Jalankan dulu untuk melihat semua lokasi:

```bash
grep -rn "revokeObjectURL" src/
```

Harus ada tujuh hasil. Satu di antaranya (`RemotionStudioTab.tsx` baris 94) sudah memakai `setTimeout` — biarkan.

**(b)** Enam lokasi sisanya, sudah terverifikasi ada di baris berikut, harus diubah semua. Pola penggantinya sama:

```ts
URL.revokeObjectURL(url);
```

menjadi

```ts
setTimeout(() => URL.revokeObjectURL(url), 2000);
```

| File | Baris sekarang | Nilai yang di-revoke |
|---|---|---|
| `src/app/[locale]/dashboard/drafts/[id]/DraftActions.tsx` | 46 | `url` |
| `src/app/[locale]/dashboard/scene-prompt/ScenePromptStudioClient.tsx` | 429 | `url` |
| `src/app/[locale]/dashboard/scene-prompt/ScenePromptStudioClient.tsx` | 714 | `url` |
| `src/components/generator/GeneratorForm.tsx` | 1100 | `url` |
| `src/components/video/VideoTimelineTab.tsx` | 147 | `url` |
| `src/components/video/VideoTimelineTab.tsx` | 169 | `url` |

Catatan: setelah satu perubahan pertama, nomor baris di bawahnya bisa bergeser. Cari berdasarkan konteksnya (baris `link.click()` atau `a.click()` diikuti `URL.revokeObjectURL`), bukan berdasarkan nomor baris.

**(c)** Pastikan tidak ada yang terlewat:

```bash
grep -rn -A3 "\.click()" src/ | grep -n "revokeObjectURL"
```

Output yang tersisa hanya boleh berasal dari `RemotionStudioTab.tsx`.

### Verifikasi

```bash
cd "$PROJ"
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint . --max-warnings=0
./node_modules/.bin/vitest run
```

### Kriteria Selesai

- Semua enam lokasi memakai `setTimeout(..., 2000)`.
- `RemotionStudioTab.tsx` tidak berubah.
- Seluruh verifikasi exit 0.

### DILARANG

- Mengubah cara URL dibuat, nama file unduhan, atau isi unduhan.
- Menambahkan `toast` atau perubahan pesan apa pun di sekitarnya.

---

## PROMPT-15 — Rapikan kode mati pada parser (delimiter yang tidak pernah bekerja)

### Konteks

Di `src/lib/parsers.ts` baris 870 ada konstanta `delimiters`, sebuah string literal berisi daftar nama field dipisah `|`. Di dalam string literal TS itu tertulis empat backslash sebelum `s`, sehingga nilai runtime-nya mengandung dua backslash. Ketika nilai itu dimasukkan ke `RegExp`, dua backslash berarti "cocokkan satu backslash literal", bukan "cocokkan spasi". Jadi seluruh alternatif di daftar itu — termasuk `Elemen\s*Visual` yang baru ditambahkan pada rilis #92 — **tidak pernah cocok dengan teks apa pun**.

Parser tetap bekerja dengan benar karena alasan lain: bagian `keys` dalam `matchField` ditulis sebagai template literal dan escaping-nya benar, dan capture berhenti lewat alternatif `$`. Verifikasi langsung sudah membuktikan ekstraksi field berjalan tepat untuk format kanonik.

**Ini bug perilaku kecil, bukan kerusakan.** Tujuannya: hilangkan kode yang terlihat penting padahal mati, supaya tidak ada pengembang berikutnya menambah alternatif baru yang juga percuma.

### File yang diubah

- `src/lib/parsers.ts`

### Perintah

**(a)** Konfirmasikan dulu sebelum mengubah apa pun:

```bash
grep -c 'Konteks\\\\\\\\s' src/lib/parsers.ts
```

Harus menghasilkan angka ≥ 1. Bila 0, kondisi sudah berubah — berhenti dan laporkan.

**(b)** Tambahkan komentar tepat di atas baris 870 (`const delimiters = ...`) yang menjelaskan kondisinya:

```ts
  // CATATAN: string ini memakai empat backslash sehingga runtime-nya menjadi dua
  // backslash, yang berarti alternatif di sini COCOK LITERAL DENGAN BACKSLASH,
  // bukan dengan spasi. Artinya daftar ini secara efektif tidak pernah cocok.
  // Ekstraksi field tetap bekerja lewat alternatif `$` di delimLookahead dan
  // lewat parameter `keys` pada matchField (escaping-nya benar di sana).
  // Jangan menambah daftar ini tanpa memperbaiki escaping-nya lebih dulu, dan
  // jalankan tests/parsers.scenes.test.ts bila mengubahnya.
```

**(c)** **Jangan memperbaiki escaping-nya dalam pekerjaan ini.** Membetulkan menjadi satu backslash akan mengaktifkan kembali seluruh daftar dan mengubah perilaku capture — itu perubahan perilaku yang berisiko dan di luar lingkup. Bila kamu sangat yakin perlu, buat prompt terpisah.

**(d)** Catat penemuan ini pada komentar `@remarks` file `tests/parsers.scenes.test.ts` bila file itu punya blok komentar fungsi — **opsional**, lewati bila tidak ada tempat yang tepat.

### Verifikasi

```bash
cd "$PROJ"
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint . --max-warnings=0
./node_modules/.bin/vitest run tests/parsers.scenes.test.ts tests/parsers.test.ts
```

### Kriteria Selesai

- Komentar catatan ada tepat di atas `const delimiters`.
- Semua test parser tetap lulus (perilaku tidak berubah).

### DILARANG

- Mengubah nilai `delimiters`.
- Mengubah `matchField` atau `delimLookahead`.

---

## PROMPT-16 — Seragamkan konstanta jumlah scene

### Konteks

`src/lib/sceneLimits.ts` menetapkan `MIN_SCENE_COUNT = 1` dan `DEFAULT_SCENE_COUNT = 10`. Tetapi `GeneratorForm.tsx` memuat tiga angka yang menyimpang: literal `6` sebagai nilai awal (baris 258), literal `6` sebagai fallback (baris 1628), dan aturan tersembunyi `if (next.targetSceneCount < 8) next.targetSceneCount = 8;` (baris 833) yang menaikkan nilai minimal user dari 1 menjadi 8 saat draft dipulihkan. Akibatnya user memasukkan 3, memuat ulang halaman, dan nilainya berubah jadi 8 tanpa penjelasan.

### File yang diubah

- `src/components/generator/GeneratorForm.tsx`

### Perintah

**(a)** Buka `src/components/generator/GeneratorForm.tsx`.

**(b)** Baris 258: ganti `targetSceneCount: 6,` menjadi `targetSceneCount: DEFAULT_SCENE_COUNT,`. Pastikan `DEFAULT_SCENE_COUNT` sudah diimpor dari `@/lib/sceneLimits` (baris 20 menunjukkan sudah).

**(c)** Baris 1628: ganti `Math.max(1, Number(videoConfig.targetSceneCount) || 6);` menjadi `Math.max(MIN_SCENE_COUNT, Number(videoConfig.targetSceneCount) || DEFAULT_SCENE_COUNT);`. Tambahkan `MIN_SCENE_COUNT` ke impor yang sama.

**(d)** Baris 833: HAPUS seluruh baris `if (next.targetSceneCount < 8) next.targetSceneCount = 8;`. Aturan minimum yang sah adalah `MIN_SCENE_COUNT` (1) dan inputnya sudah di-clamp oleh `clampSceneCount`, jadi aturan `<8` ini duplikat dan bertentangan.

**(e)** Periksa tidak ada angka magis lain yang tersisa:

```bash
grep -nE "targetSceneCount[^a-zA-Z]*[:=][^a-zA-Z]*[0-9]" src/components/generator/GeneratorForm.tsx
```

Semua kecocokan yang berupa angka literal (bukan konstanta atau variabel) harus dikonversi. Bila ada yang tidak jelas, laporkan.

### Verifikasi

```bash
cd "$PROJ"
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint . --max-warnings=0
./node_modules/.bin/vitest run src/lib/__tests__/sceneLimits.test.ts
```

### Kriteria Selesai

- Tidak ada literal `6` maupun `< 8` yang terkait `targetSceneCount`.
- Minimal input tetap 1 dan konsisten dengan `MIN_SCENE_COUNT`.
- Seluruh verifikasi exit 0.

### DILARANG

- Mengubah nilai `MIN_SCENE_COUNT`, `MAX_SCENE_COUNT`, atau `DEFAULT_SCENE_COUNT` di `sceneLimits.ts`.
- Mengubah `autoSceneCount`.

---

## PROMPT-17 — Tampilkan peringatan bila target durasi tidak dapat tercapai di Mode Auto

### Konteks

`autoSceneCount` membagi durasi target dengan rata-rata detik per scene lalu meng-clamp hasilnya ke maksimum `MAX_SCENE_COUNT` (120). Bila user memilih 600 detik dengan speech rate `fast` (3 detik per scene), rumusnya meminta 200 scene lalu dipotong diam-diam menjadi 120. Video akhirnya sekitar 360 detik, padahal user meminta 600. UI tidak pernah memberi tahu bahwa target tidak akan tercapai.

### File yang diubah

- `src/lib/sceneLimits.ts`
- `src/components/generator/GeneratorForm.tsx`
- `messages/id.json`
- `messages/en.json`

### Perintah

**(a)** Buka `src/lib/sceneLimits.ts`. Tambahkan fungsi baru setelah `autoSceneCount`:

```ts
/**
 * Apakah target durasi yang diminta user masih bisa dicapai setelah di-clamp
 * ke MAX_SCENE_COUNT? Mengembalikan detik yang benar-benar bisa dicapai.
 */
export function reachableDurationSec(
  targetDurationSec: number,
  speechRate: string | number = "medium"
): number {
  const rateMap: Record<string, number> = { slow: 6, medium: 4, fast: 3 };
  const avgSecPerScene =
    typeof speechRate === "number"
      ? Math.max(2, Math.min(10, speechRate))
      : rateMap[String(speechRate).toLowerCase()] ?? 4;
  return Math.min(targetDurationSec, MAX_SCENE_COUNT * avgSecPerScene);
}
```

**(b)** Buka `messages/id.json`, cari namespace `"Generator"`, tambahkan:

```json
      "autoDurationTruncated": "Target {target}s tidak dapat dicapai pada mode auto karena batas {max} scene. Durasi tercapai sekitar {actual}s."
```

Tambahkan juga di `messages/en.json` namespace `"Generator"`:

```json
      "autoDurationTruncated": "Target of {target}s cannot be reached in auto mode due to the {max} scene limit. Actual duration will be about {actual}s."
```

**(c)** Buka `src/components/generator/GeneratorForm.tsx`. Cari bagian yang menampilkan perhitungan auto di sekitar baris 1580–1590 (`sceneCountMode === "auto" && ...`). Di sana sudah ada tampilan `count: autoSceneCount(...)`. TAMBAHKAN tepat setelah baris itu sebuah pesan peringatan yang hanya muncul bila terpotong:

```tsx
                  {reachableDurationSec(dur, rate) < dur && (
                    <p className="text-xs text-amber-600">
                      {t("autoDurationTruncated", {
                        target: dur,
                        max: MAX_SCENE_COUNT,
                        actual: reachableDurationSec(dur, rate),
                      })}
                    </p>
                  )}
```

Sesuaikan nama variabel `dur` dan `rate` dengan nama yang benar-benar dipakai di scope tersebut (cek baris sebelumnya; bila namanya berbeda, ikuti yang ada).

**(d)** Tambahkan `reachableDurationSec` dan `MAX_SCENE_COUNT` ke impor `@/lib/sceneLimits` yang sudah ada.

### Verifikasi

```bash
cd "$PROJ"
node scripts/audit-i18n.mjs
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint . --max-warnings=0
./node_modules/.bin/vitest run src/lib/__tests__/sceneLimits.test.ts
```

### Kriteria Selesai

- Peringatan muncul hanya saat `MAX_SCENE_COUNT * avgSecPerScene < targetDurationSec`.
- Pesan tidak muncul bila target masih tercapai.
- Seluruh verifikasi exit 0.

### DILARANG

- Mengubah rumus `autoSceneCount` atau batas `MAX_SCENE_COUNT`.

---

## PROMPT-18 — Perketat gerbang audit desain agar menangkap komponen baru

### Konteks

`scripts/audit-design.mjs` lulus dengan 76 dari 88 komponen (86,4%), tetapi komponen baru rilis #96/#98 memakai warna Tailwind mentah seperti `text-sky-500`, `bg-black/80`, `text-red-500`, `text-amber-500`, dan `border-sky-500/40`. Jadi gerbang lolos sambil melewatkan komponen yang justru paling baru. `VideoTimelineTab.tsx` dan `AnimationRenderer.tsx` adalah dua contohnya.

### File yang diubah

- `scripts/audit-design.mjs`
- `src/components/video/VideoTimelineTab.tsx`
- `src/components/video/AnimationRenderer.tsx`

### Perintah

**(a)** Baca dulu `scripts/audit-design.mjs` untuk memahami: bagaimana daftar komponen dikumpulkan, bagaimana ketentuan minimum dihitung, dan di mana angka 86,4% berasal. Laporkan pemahamanmu SEBELUM mengubah apa pun.

**(b)** Naikkan ambang minimum komponen yang wajib lolos menjadi **95 persen**.

**(c)** Perbaiki dua komponen yang memakai warna mentah. Petakan ke token tema yang sudah dipakai komponen lain di file yang sama:

| Saat ini | Ganti dengan |
|---|---|
| `text-sky-500` | `text-[var(--pg-primary,#4f46e5)]` atau token setara yang dipakai komponen lain |
| `border-sky-500/40` | border dengan warna token yang sama |
| `text-red-500` | token status error yang dipakai di seluruh proyek |
| `text-amber-500` | token status peringatan yang dipakai di seluruh proyek |

**Sebelum mengganti, jalankan perintah berikut dan gunakan hasilnya sebagai sumber kebenaran, jangan menebak nama token:**

```bash
grep -rhoE 'text-\[var\(--[a-z-]+' src/ | sort -u | head -40
grep -rhoE 'pg-[a-z-]+' src/ | sort -u | head -40
```

Bila ternyata proyek punya variabel CSS atau kelas utilitas `pg-*` untuk warna status, pakai itu. Bila tidak ada sama sekali, **berhenti dan laporkan** — jangan membuat variabel baru sendiri.

**(d)** Setelah perubahan, jalankan audit. Bila masih ada komponen di bawah ambang, perbaiki komponen tersebut satu per satu dengan prinsip yang sama.

### Verifikasi

```bash
cd "$PROJ"
node scripts/audit-design.mjs
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint . --max-warnings=0
./node_modules/.bin/vitest run
```

### Kriteria Selesai

- `audit-design.mjs` exit 0 dengan ambang minimum 95 persen.
- `grep -rn "text-sky-500\|text-red-500\|text-amber-500" src/` tidak menghasilkan output.
- Seluruh verifikasi exit 0.

### DILARANG

- Menambahkan variabel CSS baru.
- Menurunkan ambang kembali bila audit gagal — perbaiki komponennya.

---

## PROMPT-19 — Konsolidasikan helper terduplikat

### Konteks

Empat file prompt builder ada di `src/lib/`: `storyboardPromptBuilder`, `fullVideoPromptBuilder`, `animationPromptBuilder`, dan `remotionPromptBuilder`. Dua di antaranya mengubah data yang sama (timeline) menjadi prompt AI. Selain itu ada fungsi helper kecil yang diduplikasi: `isRecord` didefinisikan dua kali, `getAllTsFiles` tiga kali (di skrip), dan `makeTimeline` dua kali (di test).

### File yang diubah

- `src/lib/typeGuards.ts` (file baru, untuk `isRecord`)
- file-file sumber yang memuat duplikasi

### Perintah

**Tahap ini adalah perbaikan murni identitas, tanpa perubahan perilaku.**

**(a)** Kumpulkan bukti duplikasi terlebih dahulu dan LAPORKAN sebelum mengubah apa pun:

```bash
grep -rn "function isRecord\|const isRecord" src/ tests/
grep -rn "function getAllTsFiles\|const getAllTsFiles" scripts/
grep -rn "function makeTimeline\|const makeTimeline" src/ tests/
```

**(b)** Hanya kerjakan `isRecord`, karena itu satu-satunya duplikasi di kode produksi:

- Buat `src/lib/typeGuards.ts` yang mengekspor `isRecord`.
- Ganti setiap definisi lokal menjadi impor dari file itu.
- Hapus definisi lokal yang kini tidak terpakai.

**(c)** **Jangan menyatukan empat prompt builder.** Itu perubahan desain, bukan perbaikan duplikasi, dan berisiko tinggi. Sebagai gantinya, buat ringkasan di laporan akhir: perbedaan masukan, masukan keluaran, dan titik temu keempatnya, sebagai bahan keputusan rilis berikutnya.

**(d)** Duplikasi di `scripts/` dan `tests/` biarkan dulu — itu kode bantu, bukan kode produksi.

### Verifikasi

```bash
cd "$PROJ"
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint . --max-warnings=0
./node_modules/.bin/vitest run
```

### Kriteria Selesai

- `grep -c "function isRecord" src/` hanya menghasilkan 1.
- Seluruh verifikasi exit 0.
- Laporan memuat ringkasan perbandingan keempat prompt builder.

### DILARANG

- Mengubah perilaku parser, prompt builder, atau API-nya.
- Menggabungkan file prompt builder.

---

# URUTAN PENGERJAAN

| Urutan | Prompt | Alasan |
|---|---|---|
| 1 | **PROMPT-06** | Test dan skrip audit masuk git dulu, supaya semua perbaikan berikutnya terlindungi gerbang |
| 2 | PROMPT-01 | ZIP Remotion mati total |
| 3 | PROMPT-02 | Ekstensi audio salah + test mengunci bug |
| 4 | PROMPT-03 | Upload Drive dari Remotion Studio selalu 400 |
| 5 | PROMPT-04 | 3 dari 4 tema background hitam |
| 6 | PROMPT-05 | Selaraskan ekspektasi produk |
| 7 | PROMPT-07 | Gerbang entitlement lolos |
| 8 | PROMPT-08 | 120x fetch + rate limit |
| 9 | PROMPT-10 | Pesan API hardcoded + menyesatkan |
| 10 | PROMPT-11 | Batas memori upload |
| 11 | PROMPT-09 | Konsolidasi hook (setelah PROMPT-03 dan PROMPT-10 selesai) |
| 12 | PROMPT-12 | CSP + HSTS |
| 13 | PROMPT-13 | Tombol batal render |
| 14 | PROMPT-14 | Konsistensi `revokeObjectURL` |
| 15 | PROMPT-15 | Kode mati di parser (tanpa ubah perilaku) |
| 16 | PROMPT-16 | Konstanta jumlah scene |
| 17 | PROMPT-17 | Peringatan target durasi terpotong |
| 18 | PROMPT-18 | Gerbang audit desain |
| 19 | PROMPT-19 | Duplikasi helper |

**Total: 19 prompt.** Bila jumlah berbeda dari 19 di laporan AI-mu, ada prompt yang terlewat — periksa kembali.

**Setelah PROMPT-05, jalankan penuh:**

```bash
cd "$PROJ"
./node_modules/.bin/tsc --noEmit && echo "tsc OK"
./node_modules/.bin/eslint . --max-warnings=0 && echo "lint OK"
./node_modules/.bin/vitest run && echo "vitest OK"
node scripts/audit-i18n.mjs && echo "i18n OK"
node scripts/audit-design.mjs && echo "design OK"
npm run build && echo "build OK"
```

Enam-enamnya harus mencetak OK. Bila ada yang gagal, berhenti pada prompt itu dan laporkan.

---

# PERILAKU YANG DIMINTA

- Kerjakan satu prompt, laporkan hasilnya, tunggu persetujuan sebelum lanjut.
- Selalu sertakan: daftar file yang diubah, keluaran setiap perintah verifikasi, hal yang tidak bisa diselesaikan, dan hal yang tidak kamu ubah meski ada di instruksi (beserta alasannya).
- Bila kondisi di file berbeda dari yang diprediksi instruksi (nomor baris meleset, nama fungsi tidak ada, impor tidak ditemukan), **berhenti dan laporkan** — jangan menyimpulkan sendiri.
- Jangan commit, jangan push, jangan menambah dependensi kecuali PROMPT-01 yang secara eksplisit menyuruhnya.


