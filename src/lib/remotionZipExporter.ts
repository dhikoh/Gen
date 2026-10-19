import type { VideoTimeline } from "@/types/videoTimeline";
import {
  buildRemotionBoilerplate,
  type RemotionPromptOptions,
} from "@/lib/remotionPromptBuilder";

/**
 * Decode base64 data-URL atau raw base64 string ke Uint8Array.
 */
function base64ToUint8Array(base64Str: string): Uint8Array {
  const clean = base64Str.replace(/^data:[^;]+;base64,/, "");
  if (typeof atob === "function") {
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  // Fallback Node environment
  const buf = Buffer.from(clean, "base64");
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
}

const REMOTION_VERSION = "4.0.536";

/**
 * Buat paket ZIP mandiri yang siap di-render di PC pengguna via terminal / render.bat.
 * 100% diproses di client menggunakan JSZip bawaan repo.
 */
export async function exportRemotionZip(
  timeline: VideoTimeline,
  options: RemotionPromptOptions,
): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  const componentName = options.componentName;
  const boilerplateCode = buildRemotionBoilerplate(timeline, options);

  // 1. package.json
  const packageJson = {
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
  };
  zip.file("package.json", JSON.stringify(packageJson, null, 2) + "\n");

  // 2. tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: "ES2022",
      module: "commonjs",
      jsx: "react-jsx",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    },
    include: ["src"],
  };
  zip.file("tsconfig.json", JSON.stringify(tsConfig, null, 2) + "\n");

  // 3. remotion.config.ts
  const remotionConfig = `import { Config } from "@remotion/cli/config";\n\nConfig.setVideoImageFormat("jpeg");\nConfig.setOverwriteOutput(true);\n`;
  zip.file("remotion.config.ts", remotionConfig);

  // 4. src/index.ts
  const indexTs = `import { registerRoot } from "remotion";\nimport { RemotionRoot } from "./Video";\n\nregisterRoot(RemotionRoot);\n`;
  zip.file("src/index.ts", indexTs);

  // 5. src/Video.tsx (Boilerplate TSX)
  zip.file("src/Video.tsx", boilerplateCode);

  // 6. public/audio/
  for (const scene of timeline.scenes) {
    if (scene.audioRef) {
      try {
        const audioBytes = base64ToUint8Array(scene.audioRef);
        zip.file(`public/audio/scene-${scene.sceneNumber}.wav`, audioBytes);
      } catch (err) {
        console.warn(`Gagal menyertakan audio scene ${scene.sceneNumber} ke ZIP:`, err);
      }
    }
  }

  // 7. render.bat (Windows one-click)
  const renderBat = `@echo off
echo ========================================================
echo  Rendering Remotion Video (${componentName})
echo ========================================================
echo.
echo 1. Memeriksa dependencies (npm install)...
call npm install
echo.
echo 2. Merender video ke out.mp4...
call npx remotion render ${componentName} out.mp4
echo.
echo ========================================================
echo  Selesai! Video Anda berhasil dirender di out.mp4
echo ========================================================
pause
`;
  zip.file("render.bat", renderBat);

  // 8. render.sh (Mac / Linux)
  const renderSh = `#!/bin/bash
echo "========================================================"
echo " Rendering Remotion Video (${componentName})"
echo "========================================================"
echo ""
echo "1. Installing dependencies..."
npm install
echo ""
echo "2. Rendering to out.mp4..."
npx remotion render ${componentName} out.mp4
echo ""
echo "Done! Your video is ready at out.mp4"
`;
  zip.file("render.sh", renderSh);

  // 9. README.md
  const readme = `# Remotion Video Project (${componentName})

Proyek video React Remotion v4 yang diekspor langsung dari Prompt Gen.

## Cara Menjalankan di Komputer Anda:

### Pengguna Windows:
Cukup klik ganda (double-click) file \`render.bat\`. File video \`out.mp4\` akan langsung dibuat di folder ini.

### Pengguna Mac / Linux:
Jalankan di terminal:
\`\`\`bash
chmod +x render.sh
./render.sh
\`\`\`

### Preview Interaktif (Remotion Player Studio):
\`\`\`bash
npm run preview
\`\`\`
`;
  zip.file("README.md", readme);

  return zip.generateAsync({ type: "blob" });
}
