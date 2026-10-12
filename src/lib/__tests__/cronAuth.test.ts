import { afterEach, describe, expect, it, vi } from "vitest";
import { isCronAuthorized } from "@/lib/cronAuth";

const SECRET = "test-secret-1234567890-abcdef";

function makeReq(url: string, headers: Record<string, string> = {}): Request {
  return new Request(url, { headers });
}

describe("isCronAuthorized", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("menolak semua request jika CRON_SECRET tidak diatur", () => {
    vi.stubEnv("CRON_SECRET", "");
    const req = makeReq("http://localhost/api/cron/x", {
      authorization: "Bearer promptgen_cron_internal_secret",
    });
    expect(isCronAuthorized(req)).toBe(false);
  });

  it("menolak jika CRON_SECRET terlalu pendek", () => {
    vi.stubEnv("CRON_SECRET", "pendek");
    const req = makeReq("http://localhost/api/cron/x", { authorization: "Bearer pendek" });
    expect(isCronAuthorized(req)).toBe(false);
  });

  it("menerima Bearer token yang benar", () => {
    vi.stubEnv("CRON_SECRET", SECRET);
    const req = makeReq("http://localhost/api/cron/x", { authorization: `Bearer ${SECRET}` });
    expect(isCronAuthorized(req)).toBe(true);
  });

  it("menolak Bearer token yang salah", () => {
    vi.stubEnv("CRON_SECRET", SECRET);
    const req = makeReq("http://localhost/api/cron/x", { authorization: "Bearer salah-salah-salah-salah" });
    expect(isCronAuthorized(req)).toBe(false);
  });

  it("menerima secret lewat query string (kompatibilitas)", () => {
    vi.stubEnv("CRON_SECRET", SECRET);
    const req = makeReq(`http://localhost/api/cron/x?secret=${SECRET}`);
    expect(isCronAuthorized(req)).toBe(true);
  });

  it("menolak request tanpa kredensial", () => {
    vi.stubEnv("CRON_SECRET", SECRET);
    expect(isCronAuthorized(makeReq("http://localhost/api/cron/x"))).toBe(false);
  });
});
