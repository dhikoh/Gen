import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

function getAllTsFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== "__tests__" && file !== "node_modules") {
        getAllTsFiles(fullPath, fileList);
      }
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

describe("Security Guard: noSharedAiKeys (Celah G-14)", () => {
  it("forbids shared process.env AI API keys across all source code", () => {
    const srcDir = path.resolve(__dirname, "../../");
    const allFiles = getAllTsFiles(srcDir);

    const AI_KEY_PATTERN = /process\.env\.(OPENAI|ANTHROPIC|GEMINI|GOOGLE_AI|GROQ|MISTRAL|DEEPSEEK|OPENROUTER)[A-Z_]*/;
    const YOUTUBE_KEY_PATTERN = /process\.env\.YOUTUBE[A-Z_]*/;
    const YOUTUBE_ALLOWLIST = ["lib/researchService.ts"];

    const violations: { file: string; line: number; content: string }[] = [];

    for (const filePath of allFiles) {
      const relPath = path.relative(srcDir, filePath).replace(/\\/g, "/");
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n");

      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;

        if (AI_KEY_PATTERN.test(line)) {
          violations.push({
            file: relPath,
            line: idx + 1,
            content: trimmed,
          });
        }

        if (YOUTUBE_KEY_PATTERN.test(line) && !YOUTUBE_ALLOWLIST.includes(relPath)) {
          violations.push({
            file: relPath,
            line: idx + 1,
            content: trimmed,
          });
        }
      });
    }

    expect(
      violations,
      `Ditemukan penggunaan shared process.env AI API key di codebase:\n${JSON.stringify(violations, null, 2)}`
    ).toHaveLength(0);
  });
});
