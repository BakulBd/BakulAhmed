import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy.
 *
 * `script-src` has to allow inline: the mood/theme script runs before first
 * paint so the page never flashes the wrong sky, and a nonce would require
 * middleware, which would make every route dynamic and give up static
 * prerendering. Everything else is locked down, which is where the value is:
 * no third-party origins, no framing, no plugins, forms can only post here.
 *
 * `unsafe-eval` is added in DEVELOPMENT ONLY: React's dev build uses eval()
 * for debugging features such as rebuilding stack traces. It is never sent in
 * production, where React does not use eval at all.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: http://localhost:*" : ""}`,
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  // Don't advertise the framework.
  poweredByHeader: false,

  images: {
    /**
     * The project previews in /public/work are first-party SVGs. Next refuses
     * to optimise SVG unless this is set; the sandbox policy below keeps any
     * scripting inside an SVG inert. Real screenshots (PNG/JPG/WebP) are
     * optimised normally and served as AVIF/WebP.
     */
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ["image/avif", "image/webp"],
    // Matches the sizes the portrait and project frames actually request.
    deviceSizes: [390, 640, 828, 1080, 1200, 1920],
    imageSizes: [80, 160, 240, 320, 480],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        // The contact endpoint must never be cached by a CDN.
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
