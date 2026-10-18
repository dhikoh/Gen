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

describe("Security Guard: noUnscopedLocalStorage", () => {
  it("ensures no direct localStorage or sessionStorage calls outside allowed modules", () => {
    const srcDir = path.resolve(__dirname, "../../");
    const allFiles = getAllTsFiles(srcDir);

    const violations: { file: string; line: number; content: string }[] = [];

    for (const filePath of allFiles) {
      const relPath = path.relative(srcDir, filePath).replace(/\\/g, "/");

      // Allowed exceptions: clientStorage.ts and InstallPWABanner.tsx
      if (
        relPath === "lib/clientStorage.ts" ||
        relPath === "components/InstallPWABanner.tsx"
      ) {
        continue;
      }

      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n");

      lines.forEach((line, idx) => {
        // Abaikan komentar
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;

        if (
          line.includes("localStorage.") ||
          line.includes("sessionStorage.")
        ) {
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
      `Ditemukan pemanggilan localStorage/sessionStorage langsung:\n${JSON.stringify(violations, null, 2)}`
    ).toHaveLength(0);
  });
});
