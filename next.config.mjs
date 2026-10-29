/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Default Server Action body limit is 1MB. The admin image upload form
    // accepts files up to 5MB (see MAX_IMAGE_BYTES in admin/actions.ts), so
    // raise this above that plus multipart overhead, or uploads near/above
    // 1MB fail with an unhandled 500 before reaching our own validation.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  images: {
    // All artwork stays on the original Wix media CDN — nothing is re-hosted.
    remotePatterns: [{ protocol: "https", hostname: "static.wixstatic.com" }],
  },
  async headers() {
    return [
      {
        // The service worker must never be cached by the browser or a CDN,
        // otherwise users get stuck on an old version of the app.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Content-Type", value: "application/manifest+json" }],
      },
    ];
  },
  turbopack: {
    resolveAlias: {
      // @techstark/opencv-js's emscripten glue references Node core modules
      // that don't exist in the browser (only reached via dynamic import()
      // from the wall-preview feature).
      fs: { browser: "./src/lib/emptyModule.js" },
      path: { browser: "./src/lib/emptyModule.js" },
      crypto: { browser: "./src/lib/emptyModule.js" },
    },
  },
};

export default nextConfig;
