/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

export default nextConfig;
