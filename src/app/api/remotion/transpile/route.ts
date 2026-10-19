import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import ts from "typescript";

function extractMetadata(code: string) {
  let fps = 30;
  let width = 1080;
  let height = 1920;
  let totalFrames = 900;

  const fpsMatch = code.match(/fps[:=]\s*(\d+)/i);
  if (fpsMatch) {
    const parsedFps = parseInt(fpsMatch[1], 10);
    if (parsedFps === 30 || parsedFps === 60) fps = parsedFps;
  }

  const dimMatch = code.match(/(\d{3,4})\s*x\s*(\d{3,4})/i);
  if (dimMatch) {
    width = parseInt(dimMatch[1], 10);
    height = parseInt(dimMatch[2], 10);
  } else {
    const wMatch = code.match(/W\s*=\s*(\d+)/);
    const hMatch = code.match(/H\s*=\s*(\d+)/);
    if (wMatch) width = parseInt(wMatch[1], 10);
    if (hMatch) height = parseInt(hMatch[1], 10);
  }

  const durMatch =
    code.match(/(?:durationInFrames|total|TOTAL)[^=0-9]{0,20}[=:]\s*(\d+)/i) ||
    code.match(/total\s+(\d+)\s+frame/i);
  if (durMatch) {
    totalFrames = parseInt(durMatch[1], 10);
  }

  return { fps, width, height, totalFrames };
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const rawCode = typeof body.code === "string" ? body.code.trim() : "";
    if (!rawCode) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    // Strip markdown code block fences if present
    let cleanCode = rawCode;
    const fenceMatch = cleanCode.match(/^```(?:tsx|typescript|jsx|js)?\r?\n([\s\S]*?)\r?\n```$/);
    if (fenceMatch) {
      cleanCode = fenceMatch[1];
    } else {
      // Cari blok di dalam teks bila ada teks pengantar
      const innerMatch = cleanCode.match(/```(?:tsx|typescript|jsx|js)?\r?\n([\s\S]*?)\r?\n```/);
      if (innerMatch) {
        cleanCode = innerMatch[1];
      }
    }

    // Pre-normalize common LLM syntax anomalies before feeding to TypeScript compiler
    cleanCode = cleanCode.replace(/export\s+default\s+const\s+(\w+)\s*=/g, "const $1 = ");

    // Transpile TypeScript + JSX to standard ES2020 JavaScript
    const transpileResult = ts.transpileModule(cleanCode, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.React,
        removeComments: false,
      },
    });

    let js = transpileResult.outputText;

    // Bersihkan import eksternal agar bisa dievaluasi dengan mock runtime
    js = js.replace(/import\s+React(?:\s*,\s*\{[^}]*\})?\s+from\s+['"]react['"];?/g, "");
    js = js.replace(/import\s+\{[^}]*\}\s+from\s+['"]remotion['"];?/g, "");
    js = js.replace(/import\s+[^;]+from\s+['"][^'"]+['"];?/g, "");
    js = js.replace(/export\s+default\s+function\s*(\w+)?/g, "win.__RemotionComponent = function $1");
    js = js.replace(/export\s+const\s+(\w+)\s*=/g, "const $1 = win.__RemotionComponent = ");
    js = js.replace(/export\s+default\s+(\w+);?/g, "win.__RemotionComponent = $1;");

    // Fallback: If win.__RemotionComponent was not set, try well-known component names
    js += `\nif (typeof win.__RemotionComponent === "undefined") {
  if (typeof MainVideo !== "undefined") win.__RemotionComponent = MainVideo;
  else if (typeof SnakeAnimation !== "undefined") win.__RemotionComponent = SnakeAnimation;
  else if (typeof Snake !== "undefined") win.__RemotionComponent = Snake;
  else if (typeof Video !== "undefined") win.__RemotionComponent = Video;
  else if (typeof App !== "undefined") win.__RemotionComponent = App;
}\n`;

    const meta = extractMetadata(cleanCode);

    return NextResponse.json({
      success: true,
      jsCode: js,
      fps: meta.fps,
      width: meta.width,
      height: meta.height,
      totalFrames: meta.totalFrames,
    });
  } catch (err) {
    console.error("Transpilation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to transpile code" },
      { status: 500 }
    );
  }
}
