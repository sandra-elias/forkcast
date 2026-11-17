import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Basic security headers on every response.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" }, // don't guess file types
          { key: "X-Frame-Options", value: "DENY" }, // can't be embedded in other sites (clickjacking)
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Only this site may ask for location; camera/mic are never used.
          { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=()" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
