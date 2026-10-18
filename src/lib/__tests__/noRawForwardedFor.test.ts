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

describe("Security Guard: noRawForwardedFor", () => {
  it("forbids raw x-forwarded-for string outside src/lib/rateLimit.ts", () => {
    const srcDir = path.resolve(__dirname, "../../");
    const allFiles = getAllTsFiles(srcDir);

    const violations: { file: string; line: number; content: string }[] = [];

    for (const filePath of allFiles) {
      const relPath = path.relative(srcDir, filePath).replace(/\\/g, "/");

      // Allowed exception: src/lib/rateLimit.ts
      if (relPath === "lib/rateLimit.ts") {
        continue;
      }

      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n");

      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes("x-forwarded-for")) {
          violations.push({
            file: relPath,
            line: idx + 1,
            content: line.trim(),
          });
        }
      });
    }

    expect(
      violations,
      `Ditemukan pemakaian langsung x-forwarded-for di luar rateLimit.ts:\n${JSON.stringify(violations, null, 2)}`
    ).toHaveLength(0);
  });
});
