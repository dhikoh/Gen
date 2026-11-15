import { describe, it, expect } from "vitest";
import {
  parseScenes,
  extractWebMotionHtml,
  cleanNarasiForTts,
  extractAudioCues,
  estimateExpressivePauseSeconds,
} from "@/lib/parsers";

describe("E2E Skenario 2: Web Motion Parser, Stop-Boundary & Live Player Sandbox Integration", () => {
  const mockRealisticAiOutput = `
OPSI JUDUL:
1. 5 Tools AI Otomasi Solo Founder Paling Efisien
2. Hemat 20 Jam Seminggu Tanpa Karyawan Pakai AI
3. Rahasia Otomasi Kerja Cerdas 2026

ADEGAN 1
DURASI: 10 Detik
PERGERAKAN KAMERA (#world):
Kamera virtual push-in halus dari scale 1.0 ke 1.15 menuju kartu arsitektur workflow utama.
KOMPONEN GRAFIS & ANIMASI:
- Background: Gradient mesh gelap (#0a0f1d ke #050811) dengan partikel grid CAD berpendar.
- Elemen Utama: Kartu dashboard 'Automate OS' muncul dengan stagger scale-up (power3.out).
- Teks Overlay: 'HEMAT 20 JAM / MINGGU' dengan kinetic counter.
NARASI:
[senyum percaya diri] Berapa banyak waktu kamu terbuang cuma buat pekerjaan repetitif setiap harinya? [AMBIENT: suasana hening kantor malam] Sekarang ada cara jauh lebih cerdas. [SFX: Whoosh swoosh halus] [BGM: Upbeat Lo-Fi Synth 110 BPM]

ADEGAN 2
DURASI: 15 Detik
PERGERAKAN KAMERA (#world):
Kamera pan lateral ke kanan sejauh -400px, fokus pada diagram pipeline otomatis.
KOMPONEN GRAFIS & ANIMASI:
- Tiga node proses (Input -> AI Agent -> Output) terhubung oleh garis neon bergerak.
- Ikon centang hijau sukses meledak halus (elastic.out).
NARASI:
[fokus menjelaskan] Mulai dari sortir email, buat draft naskah, sampai publish konten bisa jalan otomatis [beat] tanpa kamu sentuh sama sekali. [SFX: Digital chime data complete]

ADEGAN 3
DURASI: 10 Detik
PERGERAKAN KAMERA (#world):
Kamera pull-back ke overview komposisi utuh scale 0.95 dan settle sempurna.
KOMPONEN GRAFIS & ANIMASI:
- Tombol CTA 'Coba Gratis Sekarang' membesar dengan pulse pendar cyan.
- Kartu ringkasan terlipat rapi di sudut bawah.
NARASI:
[ajakan ramah] Mau template workflow-nya? Klik link di bio dan mulai otomasi bisnis kamu hari ini! [SFX: Button click pop]

KODE WEB MOTION (STANDALONE HTML5 + GSAP):
\`\`\`html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Indo Tech Horizon - Motion Video</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #050811; color: #ffffff; font-family: 'Inter', sans-serif; overflow: hidden; }
    #viewport { width: 1080px; height: 1920px; position: relative; overflow: hidden; background: radial-gradient(circle at 50% 30%, #1e293b, #050811); }
    #world { width: 100%; height: 100%; position: absolute; top: 0; left: 0; }
    .card { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 40px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 24px; }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
</head>
<body>
  <div id="viewport">
    <div id="world">
      <div class="card" id="heroCard">
        <h1>HEMAT 20 JAM / MINGGU</h1>
      </div>
    </div>
  </div>
  <script>
    const tl = gsap.timeline({ repeat: -1 });
    tl.to("#world", { scale: 1.15, duration: 10, ease: "power2.out" })
      .to("#world", { x: -400, duration: 15, ease: "expo.out" })
      .to("#world", { scale: 0.95, x: 0, duration: 10, ease: "power3.inOut" });
  </script>
</body>
</html>
\`\`\`
`;

  it("extracts scenes cleanly with ZERO leakage of Web Motion HTML code into Scene 3", () => {
    const scenes = parseScenes(mockRealisticAiOutput);

    expect(scenes).toHaveLength(3);

    // Adegan 1 verifikasi
    expect(scenes[0].sceneNumber).toBe("Scene 1");
    expect(scenes[0].id).toBe(1);
    expect(scenes[0].narasi).toContain("Berapa banyak waktu kamu terbuang");
    expect(scenes[0].settingKamera).toContain("push-in halus dari scale 1.0 ke 1.15");
    expect(scenes[0].visual).toContain("Gradient mesh gelap");

    // Adegan 2 verifikasi
    expect(scenes[1].sceneNumber).toBe("Scene 2");
    expect(scenes[1].id).toBe(2);
    expect(scenes[1].settingKamera).toContain("pan lateral ke kanan sejauh -400px");

    // Adegan 3 (Terakhir sebelum blok HTML) - PENTING: Stop boundary harus bersih!
    expect(scenes[2].sceneNumber).toBe("Scene 3");
    expect(scenes[2].id).toBe(3);
    expect(scenes[2].narasi).toContain("Mau template workflow-nya? Klik link di bio");
    
    // Verifikasi Stop-Boundary Mutlak: Tidak ada potongan kode HTML yang merembes ke adegan terakhir
    expect(scenes[2].narasi).not.toContain("<!DOCTYPE html>");
    expect(scenes[2].narasi).not.toContain("KODE WEB MOTION");
    expect(scenes[2].visual).not.toContain("<!DOCTYPE html>");
    expect(scenes[2].visual).not.toContain("gsap.timeline");
    expect(scenes[2].settingKamera).not.toContain("<style>");
  });

  it("extracts complete standalone HTML5+GSAP code ready for live iframe player", () => {
    const extractedHtml = extractWebMotionHtml(mockRealisticAiOutput);

    expect(extractedHtml).not.toBeNull();
    const html = extractedHtml as string;

    // Struktur HTML5 mandiri lengkap
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html");
    expect(html).toContain("</html>");
    expect(html).toContain("<head>");
    expect(html).toContain("<body>");

    // Keberadaan CDN resmi GSAP 3.x
    expect(html).toContain("cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js");

    // Keberadaan container koordinat kamera virtual #world
    expect(html).toContain('id="world"');
    expect(html).toContain("gsap.timeline");

    // Zero placeholder check
    expect(html).not.toContain("// ...");
    expect(html).not.toContain("TODO:");
  });

  it("cleans narration for Text-To-Speech (TTS) by removing acting and ambient cues cleanly", () => {
    const scenes = parseScenes(mockRealisticAiOutput);
    const scene1 = scenes[0];

    // Cek ekstraksi ambient cues yang terisolasi di properti ambientCues
    expect(scene1.ambientCues).toContain("suasana hening kantor malam");

    // Cek pembersihan naskah TTS: suara speaker tidak boleh melafalkan bracket akting
    const ttsCleanText = cleanNarasiForTts(scene1.narasi);
    expect(ttsCleanText).not.toContain("[senyum percaya diri]");
    expect(ttsCleanText).not.toContain("[AMBIENT:");
    expect(ttsCleanText).not.toContain("suasana hening kantor malam");
    expect(ttsCleanText).toBe("Berapa banyak waktu kamu terbuang cuma buat pekerjaan repetitif setiap harinya? Sekarang ada cara jauh lebih cerdas.");
  });

  it("accurately calculates timing without artificially bloating dead-air for ambient audio tags", () => {
    const scenes = parseScenes(mockRealisticAiOutput);
    const scene1 = scenes[0];
    const scene2 = scenes[1];

    // Scene 1 hanya punya ambient & senyum (tidak ada [beat] atau [pause])
    const scene1Pauses = estimateExpressivePauseSeconds(scene1.narasi);
    expect(scene1Pauses).toBe(0);

    // Scene 2 punya [beat], jeda terhitung presisi
    const scene2Pauses = estimateExpressivePauseSeconds(scene2.narasi);
    expect(scene2Pauses).toBeGreaterThan(0);
  });
});
