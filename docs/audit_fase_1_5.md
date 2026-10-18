# Audit Teknis FASE 1–5 — Temuan & Perbaikan

Audit dilakukan terhadap kelima dokumen fase. Setiap temuan dikategorikan:
- 🔴 **Kritis** — Bisa menyebabkan bug, celah keamanan, atau kegagalan build
- 🟡 **Sedang** — Fungsional tapi ada gap yang perlu ditambahkan
- 🟢 **Rendah** — Perbaikan kualitas, bukan blocker

---

## Jawaban: Apakah Google Drive per User?

**YA** — setiap user punya pengaturan sendiri. Mekanismenya:

| Aspek | Per User? | Cara |
|-------|-----------|------|
| OAuth token | ✅ | `UserGoogleDriveToken.userId` `@unique` — 1 user = 1 token |
| Enkripsi token | ✅ | AAD = `gdrive:<userId>` — token user A tidak bisa didekripsi untuk user B |
| Google account | ✅ | Setiap user login ke Google-nya sendiri via OAuth2 |
| Upload | ✅ | `getValidAccessToken(session.user.id)` — hanya pakai token milik user |
| Disconnect | ✅ | `revokeGoogleDriveToken(userId)` — hanya revoke token user itu |
| Logout cleanup | ✅ | `LogoutButton` panggil disconnect per session user |

**Tapi ada gap** — lihat temuan F5-1 s/d F5-7 di bawah.

---

## FASE 1 — Isolasi & Hardening ✅ Solid

| # | Severity | Temuan |
|---|----------|--------|
| F1-1 | 🟢 | `crypto.ts` — Tidak ada versioned key derivation. Jika `API_KEY_ENCRYPTION_SECRET` dirotasi, semua ciphertext v2 lama gagal dekripsi. **Fix:** Tambahkan komentar di `getKey()` bahwa rotasi secret memerlukan re-encrypt batch semua `UserApiKey.encryptedKey` dan `UserGoogleDriveToken.encrypted*`. Atau implementasi multi-key lookup. |
| F1-2 | 🟢 | `LogoutButton.tsx` — `clearAllUserScopedStorage()` dan `clearSensitiveCaches()` belum didefinisikan di FASE 1 kode. Ada di langkah 1.2 dan 1.3 tapi tidak ada cross-reference eksplisit ke nama fungsi yang harus di-import. **Fix:** Tambahkan import path: `import { clearAllUserScopedStorage } from "@/lib/clientStorage"` dan `import { clearSensitiveCaches } from "@/lib/swCacheUtils"`. |

**Verdict:** FASE 1 sudah sangat teknis. 2 temuan rendah saja.

---

## FASE 2 — Scene Limit & Auto 🟡 Ada 3 Gap

| # | Severity | Temuan |
|---|----------|--------|
| F2-1 | 🟡 | **State `sceneCountMode` hilang saat reload.** `useState<"auto" \| "manual">("auto")` tidak persisten. User yang memilih Manual lalu refresh akan kembali ke Auto. **Fix:** Simpan ke `clientStorage` (dari Fase 1) dengan key `pg:<userId>:sceneCountMode`. Tambahkan `useEffect` untuk load dan save. |
| F2-2 | 🟡 | **`targetDurationSec` tidak didefinisikan sumbernya.** Kode referensi `videoConfig.targetDurationSec ?? 60` tapi tidak ada instruksi bagaimana field ini diisi di `GeneratorForm`. Apakah dari input user? Dari ContentArchetype? **Fix:** Tambahkan instruksi eksplisit: "Field `targetDurationSec` sudah ada di `videoConfig` state dari implementasi sebelumnya. Jika belum ada, tambahkan input durasi target (detik) dengan min=10, max=600, default=60." |
| F2-3 | 🟢 | **Definition of Done menyebut "10 test" tapi hanya 10 test case ditulis.** Tidak ada guard test untuk parser `MAX_SCENE_COUNT` break. **Fix:** Tambahkan test di `src/lib/__tests__/parsers.test.ts`: "parseScenes stops at MAX_SCENE_COUNT even if AI returns 200 scenes". |

---

## FASE 3 — Tab Full Video & Timeline 🟡 Ada 4 Gap

| # | Severity | Temuan |
|---|----------|--------|
| F3-1 | 🔴 | **`usedTitleTexts` ada di langkah 3.7 tapi TIDAK di interface 3.2.** Interface `VideoTimeline` di 3.2 tidak punya field `usedTitleTexts`. Langkah 3.7 menyuruh menambahkan tapi AI agent mungkin tidak memahami "tambahkan ke interface" tanpa lokasi persis. **Fix:** Tambahkan `usedTitleTexts?: string[];` langsung ke interface `VideoTimeline` di 3.2, bukan di 3.7. |
| F3-2 | 🟡 | **Feature flag check tidak ada di kode tab.** DoD menyebut "di bawah feature flag `fullVideoStudio`" tapi langkah 3.4 tidak menunjukkan bagaimana memeriksa flag. **Fix:** Tambahkan instruksi: "Sebelum render tab, periksa `hasFeature(userPlan.features, 'fullVideoStudio')`. Jika false, tampilkan pesan upgrade." |
| F3-3 | 🟡 | **Fetch `/api/used-titles` di langkah 3.7 — route ini belum ada.** Tidak jelas apakah route ini sudah ada dari implementasi sebelumnya. **Fix:** Tambahkan instruksi: "Jika route `/api/used-titles` belum ada, gunakan `grep -rn 'used-titles\|UsedTitle' src/app/api/` untuk menemukan endpoint yang sudah ada. Jika endpoint tidak ada, buat baru di `src/app/api/used-titles/route.ts` dengan `prisma.usedTitle.findMany({ where: { channelId }, select: { id: true, title: true } })`." |
| F3-4 | 🟢 | **`formatTime` duplikat.** Fungsi ini didefinisikan di `VideoTimelineTab.tsx` dan akan dibutuhkan lagi di Fase 4. **Fix:** Pindahkan ke `src/lib/formatTime.ts` dan import dari sana. |

---

## FASE 4 — Kode Animasi & Render 🔴 Ada 5 Gap

| # | Severity | Temuan |
|---|----------|--------|
| F4-1 | 🔴 | **Frame sync race condition di `videoAssembler.ts`.** `renderNextFrame()` mengirim `postMessage({ type: "seek" })` lalu langsung memanggil `requestAnimationFrame(renderNextFrame)` tanpa menunggu respons frame dari iframe. Frame akan terlewat atau terduplikat. **Fix:** Ubah ke sequential: setelah `postMessage("seek")`, tunggu `message event` dengan `type: "frame"` sebelum lanjut ke frame berikutnya. Implementasi: |
| | | ```ts |
| | | // Ganti requestAnimationFrame loop dengan promise-based: |
| | | function waitForFrame(): Promise<string> { |
| | |   return new Promise((resolve) => { |
| | |     function handler(e: MessageEvent) { |
| | |       if (e.data?.type === "frame") { |
| | |         window.removeEventListener("message", handler); |
| | |         resolve(e.data.dataUrl); |
| | |       } |
| | |     } |
| | |     window.addEventListener("message", handler); |
| | |   }); |
| | | } |
| | | async function renderAllFrames() { |
| | |   for (let f = 0; f < totalFrames; f++) { |
| | |     iframeEl.contentWindow?.postMessage({ type: "seek", time: f / fps }, "*"); |
| | |     const dataUrl = await waitForFrame(); |
| | |     // Draw to offscreen canvas |
| | |     const img = new Image(); |
| | |     img.src = dataUrl; |
| | |     await img.decode(); |
| | |     offCtx.drawImage(img, 0, 0); |
| | |     onProgress?.({ currentFrame: f + 1, totalFrames, percent: ... }); |
| | |     // Yield to browser |
| | |     await new Promise(r => setTimeout(r, 0)); |
| | |   } |
| | | } |
| | | ``` |
| F4-2 | 🔴 | **`validateAnimationCode` regex stateful bug.** Pattern dengan flag `gi` (global + case-insensitive) menyebabkan `lastIndex` tidak reset antar pemanggilan `.test()`. Kedua panggilan berturut-turut bisa memberi hasil berbeda. **Fix:** Hapus flag `g` dari semua regex di `validateAnimationCode` — flag `i` sudah cukup: |
| | | ```ts |
| | | // Salah: /\bfetch\s*\(/gi  |
| | | // Benar: /\bfetch\s*\(/i |
| | | ``` |
| F4-3 | 🟡 | **Tidak ada batas ukuran HTML yang di-paste.** User bisa paste 50 MB HTML ke textarea, menyebabkan browser hang. **Fix:** Tambahkan validasi: `const MAX_HTML_SIZE = 2 * 1024 * 1024; // 2 MB` dan tolak di `validateAnimationCode` jika `html.length > MAX_HTML_SIZE`. |
| F4-4 | 🟡 | **CSP header untuk halaman yang memuat iframe tidak disebutkan.** Iframe `sandbox="allow-scripts"` sudah benar, tapi halaman parent juga perlu CSP yang mengizinkan `blob:` dan `data:` untuk canvas toDataURL. **Fix:** Tambahkan instruksi: "Di `next.config.ts` atau middleware CSP, pastikan `img-src` menyertakan `blob: data:` untuk route `/dashboard/scene-prompt`." |
| F4-5 | 🟡 | **Audio + video tidak digabung.** Dokumen mengakui ini tapi tidak memberikan path forward. User mendapat 2 file terpisah (video.webm + audio.wav). **Fix:** Tambahkan catatan teknis: "Untuk menggabungkan audio + video menjadi satu file, opsi masa depan: (a) FFmpeg.wasm di browser, (b) server-side ffmpeg endpoint, (c) gunakan MediaRecorder dengan AudioContext destination yang sudah di-mix." |

---

## FASE 5 — Google Drive 🟡 Ada 7 Gap

| # | Severity | Temuan |
|---|----------|--------|
| F5-1 | 🔴 | **Upload route TIDAK memeriksa feature flag.** `POST /api/user/google-drive/upload` langsung cek `getValidAccessToken` tanpa `requireActiveSubscription()` dan `hasFeature("googleDriveUpload")`. User dengan paket Standard yang belum seharusnya bisa upload bisa bypass. **Fix:** Tambahkan setelah rate limit: |
| | | ```ts |
| | | const user = await prisma.user.findUnique({ |
| | |   where: { id: session.user.id }, |
| | |   include: { subscriptions: { include: { plan: true } } } |
| | | }); |
| | | await requireActiveSubscription(user); |
| | | if (!hasFeature(user.plan.features, "googleDriveUpload")) { |
| | |   return NextResponse.json({ error: "Feature not available" }, { status: 403 }); |
| | | } |
| | | ``` |
| F5-2 | 🔴 | **Upload tidak punya batas ukuran.** `data: z.string().min(1)` tanpa `.max()`. User bisa mengirim 500 MB base64 ke server. **Fix:** Tambahkan max: `data: z.string().min(1).max(100 * 1024 * 1024)` (100 MB base64 ≈ 75 MB file). Juga tambahkan di Next.js config: `api: { bodyParser: { sizeLimit: "100mb" } }` untuk route ini saja. |
| F5-3 | 🟡 | **OAuth state bukan CSRF-safe.** `state: session.user.id` bisa ditebak (cuid panjang tapi tetap statis). Penyerang yang tahu userId bisa craft redirect. **Fix:** Gunakan random token + simpan di session/cookie: |
| | | ```ts |
| | | const csrfToken = crypto.randomUUID(); |
| | | // Simpan di httpOnly cookie |
| | | cookies().set("gdrive_csrf", csrfToken, { httpOnly: true, maxAge: 300 }); |
| | | // state = csrfToken |
| | | params.set("state", csrfToken); |
| | | // Di callback: verifikasi cookies().get("gdrive_csrf") === state |
| | | ``` |
| F5-4 | 🟡 | **`GET /api/user/google-drive/status` disebut tapi kodenya tidak ada.** Langkah 5.8 menyuruh "buat route sederhana" tanpa memberikan kode. **Fix:** Tambahkan kode lengkap: |
| | | ```ts |
| | | // src/app/api/user/google-drive/status/route.ts |
| | | export async function GET() { |
| | |   const session = await getServerSession(authOptions); |
| | |   if (!session?.user?.id) return NextResponse.json({ connected: false }); |
| | |   const token = await prisma.userGoogleDriveToken.findUnique({ |
| | |     where: { userId: session.user.id }, |
| | |     select: { expiresAt: true, scopes: true }, |
| | |   }); |
| | |   return NextResponse.json({ |
| | |     connected: !!token, |
| | |     expiresAt: token?.expiresAt ?? null, |
| | |   }); |
| | | } |
| | | ``` |
| F5-5 | 🟡 | **Tidak ada folder picker/creation.** Semua file diupload ke root Google Drive. Setelah 20 video, Drive user berantakan. **Fix:** Tambahkan tugas opsional 5.8b: buat folder "Prompt Gen Videos" otomatis saat pertama upload, simpan `folderId` di `UserGoogleDriveToken`, pakai di subsequent uploads. |
| F5-6 | 🟡 | **Rate limit hanya per IP, bukan per user.** `gdrive_upload_${getClientIp(req)}` — di shared IP (kantor, VPN) satu user yang spam bisa mengunci user lain. **Fix:** Ganti key ke: `gdrive_upload_${session.user.id}`. |
| F5-7 | 🟢 | **Tidak ada retry/resume untuk upload gagal.** Resumable upload dipakai server-side tapi jika request client ke server gagal, tidak ada retry. **Fix:** Tambahkan catatan: "Client sebaiknya implement retry dengan exponential backoff di `handleUploadToDrive`. Simpan `videoBlob` sampai upload confirmed." |

---

## Ringkasan

| Fase | 🔴 Kritis | 🟡 Sedang | 🟢 Rendah | Total |
|------|-----------|-----------|-----------|-------|
| 1 | 0 | 0 | 2 | 2 |
| 2 | 0 | 2 | 1 | 3 |
| 3 | 1 | 2 | 1 | 4 |
| 4 | 2 | 3 | 0 | 5 |
| 5 | 2 | 4 | 1 | 7 |
| **Total** | **5** | **11** | **5** | **21** |

### Rekomendasi

1. **Wajib diperbaiki sebelum eksekusi:** F3-1, F4-1, F4-2, F5-1, F5-2 (5 kritis)
2. **Sebaiknya diperbaiki:** F2-1, F2-2, F3-2, F3-3, F4-3, F4-4, F4-5, F5-3, F5-4, F5-5, F5-6 (11 sedang)
3. **Opsional:** sisanya (5 rendah)

Mau saya langsung perbaiki dokumen FASE 2–5 dengan memasukkan semua fix di atas?
