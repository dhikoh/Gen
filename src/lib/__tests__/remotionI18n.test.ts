import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { REMOTION_ISSUE_CODES } from "../remotionPromptBuilder";

function readNamespace(locale: string, namespace: string): Record<string, unknown> {
  const raw: unknown = JSON.parse(readFileSync(join(process.cwd(), "messages", locale + ".json"), "utf8"));
  if (typeof raw === "object" && raw !== null) {
    const ns = (raw as Record<string, unknown>)[namespace];
    if (typeof ns === "object" && ns !== null) return ns as Record<string, unknown>;
  }
  return {};
}

describe("i18n RemotionStudio", () => {
  const id = readNamespace("id", "RemotionStudio");
  const en = readNamespace("en", "RemotionStudio");

  it("namespace ada dan key id/en identik (termasuk urutan)", () => {
    expect(Object.keys(id).length).toBeGreaterThan(0);
    expect(Object.keys(en)).toEqual(Object.keys(id));
  });

  it("setiap RemotionIssueCode punya pesan di kedua bahasa", () => {
    for (const code of REMOTION_ISSUE_CODES) {
      const key = "validatorIssue_" + code;
      expect(typeof id[key]).toBe("string");
      expect(typeof en[key]).toBe("string");
    }
  });
});
