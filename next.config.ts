import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withPWAInit from "next-pwa";
import defaultRuntimeCaching from "next-pwa/cache";

const withNextIntl = createNextIntlPlugin();

// Jangan pernah meng-cache API & halaman berotentikasi di service worker.
const neverCache = {
  urlPattern: ({ url, sameOrigin }: { url: URL; sameOrigin: boolean }) =>
    sameOrigin &&
    (url.pathname.startsWith("/api/") ||
      /^\/(id|en)\/(dashboard|admin)(\/|$)/.test(url.pathname)),
  handler: "NetworkOnly" as const,
};

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [neverCache, ...(defaultRuntimeCaching as unknown[])],
});

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Route render animasi & preview membutuhkan CSP dengan blob: dan data:
      {
        source: "/:locale(id|en)/dashboard/scene-prompt",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' blob: data:; media-src 'self' blob: data:; frame-src 'self' blob:; connect-src 'self';",
          },
        ],
      },
      // Jangan cache respons API milik user. Pengecualian: gambar storyboard (punya Cache-Control sendiri).
      {
        source: "/api/:path((?!storyboard/panels/).*)",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
      },
    ];
  },
};

export default withPWA(withNextIntl(nextConfig));
