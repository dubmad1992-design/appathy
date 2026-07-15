import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the e2e dev server build somewhere other than .next so it can
  // never clobber the production build on the server.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  poweredByHeader: false,
  outputFileTracingRoot: path.resolve(__dirname),
  images: {
    unoptimized: true
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: "upgrade-insecure-requests; block-all-mixed-content" }
        ]
      }
    ];
  }
};

export default nextConfig;
