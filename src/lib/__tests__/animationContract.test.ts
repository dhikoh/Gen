import { describe, it, expect } from "vitest";
import {
  validateAnimationCode,
  CANVAS_ID,
  MAX_HTML_SIZE,
} from "@/lib/animationContract";

describe("animationContract", () => {
  const validHtml = `<!DOCTYPE html>
<html>
<head>
</head>
<body>
  <canvas id="${CANVAS_ID}" width="1920" height="1080"></canvas>
  <script>
    window.__anim = {
      seek: function(t) {},
      getDuration: function() { return 10; },
      getReadyPromise: function() { return Promise.resolve(); }
    };
  </script>
</body>
</html>`;

  it("accepts a valid HTML animation code", () => {
    const errors = validateAnimationCode(validHtml);
    expect(errors).toEqual([]);
  });

  it("detects missing canvas element", () => {
    const htmlNoCanvas = validHtml.replace(`id="${CANVAS_ID}"`, 'id="other-canvas"');
    const errors = validateAnimationCode(htmlNoCanvas);
    expect(errors.some((e) => e.includes(`id "${CANVAS_ID}"`))).toBe(true);
  });

  it("detects missing window.__anim", () => {
    const htmlNoAnim = validHtml.replace("window.__anim", "window.someOtherObject");
    const errors = validateAnimationCode(htmlNoAnim);
    expect(errors.some((e) => e.includes("window.__anim"))).toBe(true);
  });

  it("rejects fetch() network calls", () => {
    const badHtml = validHtml.replace("seek: function(t) {}", "seek: function(t) { fetch('https://evil.com'); }");
    const errors = validateAnimationCode(badHtml);
    expect(errors.some((e) => e.includes("fetch()"))).toBe(true);
  });

  it("rejects XMLHttpRequest network calls", () => {
    const badHtml = validHtml.replace("seek: function(t) {}", "seek: function(t) { const x = new XMLHttpRequest(); }");
    const errors = validateAnimationCode(badHtml);
    expect(errors.some((e) => e.includes("XMLHttpRequest"))).toBe(true);
  });

  it("rejects WebSocket connections", () => {
    const badHtml = validHtml.replace("seek: function(t) {}", "seek: function(t) { const s = new WebSocket('ws://evil.com'); }");
    const errors = validateAnimationCode(badHtml);
    expect(errors.some((e) => e.includes("WebSocket"))).toBe(true);
  });

  it("rejects dynamic import()", () => {
    const badHtml = validHtml.replace("seek: function(t) {}", "seek: function(t) { import('./module.js'); }");
    const errors = validateAnimationCode(badHtml);
    expect(errors.some((e) => e.includes("dynamic import()"))).toBe(true);
  });

  it("rejects static import", () => {
    const badHtml = `import foo from 'bar';\n${validHtml}`;
    const errors = validateAnimationCode(badHtml);
    expect(errors.some((e) => e.includes("static import"))).toBe(true);
  });

  it("rejects external src and href attributes", () => {
    const badSrc = validHtml.replace("<head>", '<head><script src="https://cdn.example.com/lib.js"></script>');
    const errorsSrc = validateAnimationCode(badSrc);
    expect(errorsSrc.some((e) => e.includes("external src"))).toBe(true);

    const badHref = validHtml.replace("<head>", '<head><link href="https://cdn.example.com/style.css" rel="stylesheet">');
    const errorsHref = validateAnimationCode(badHref);
    expect(errorsHref.some((e) => e.includes("external href"))).toBe(true);
  });

  it("rejects localStorage access", () => {
    const badHtml = validHtml.replace("seek: function(t) {}", "seek: function(t) { localStorage.setItem('k', 'v'); }");
    const errors = validateAnimationCode(badHtml);
    expect(errors.some((e) => e.includes("localStorage"))).toBe(true);
  });

  it("rejects sessionStorage access", () => {
    const badHtml = validHtml.replace("seek: function(t) {}", "seek: function(t) { sessionStorage.getItem('k'); }");
    const errors = validateAnimationCode(badHtml);
    expect(errors.some((e) => e.includes("sessionStorage"))).toBe(true);
  });

  it("rejects indexedDB access", () => {
    const badHtml = validHtml.replace("seek: function(t) {}", "seek: function(t) { indexedDB.open('db'); }");
    const errors = validateAnimationCode(badHtml);
    expect(errors.some((e) => e.includes("indexedDB"))).toBe(true);
  });

  it("rejects dialog methods (alert, confirm, prompt)", () => {
    const badAlert = validHtml.replace("seek: function(t) {}", "seek: function(t) { alert('hi'); }");
    expect(validateAnimationCode(badAlert).some((e) => e.includes("alert()"))).toBe(true);

    const badConfirm = validHtml.replace("seek: function(t) {}", "seek: function(t) { confirm('ok?'); }");
    expect(validateAnimationCode(badConfirm).some((e) => e.includes("confirm()"))).toBe(true);

    const badPrompt = validHtml.replace("seek: function(t) {}", "seek: function(t) { prompt('name:'); }");
    expect(validateAnimationCode(badPrompt).some((e) => e.includes("prompt()"))).toBe(true);
  });

  it("rejects HTML larger than MAX_HTML_SIZE", () => {
    const giantString = "a".repeat(MAX_HTML_SIZE + 10);
    const errors = validateAnimationCode(giantString);
    expect(errors.some((e) => e.includes("Kode HTML terlalu besar"))).toBe(true);
  });

  it("is non-stateful: consecutive calls with identical input return identical results", () => {
    const testCases = [
      validHtml,
      validHtml.replace("seek: function(t) {}", "seek: function(t) { fetch('https://api.com'); localStorage.getItem('k'); alert('test'); }"),
      `<!DOCTYPE html><html><body>${"x".repeat(100)}</body></html>`,
    ];

    for (const html of testCases) {
      const run1 = validateAnimationCode(html);
      const run2 = validateAnimationCode(html);
      const run3 = validateAnimationCode(html);

      expect(run1).toEqual(run2);
      expect(run2).toEqual(run3);
    }
  });
});
