import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Classic dynamic-rendering model: the app is always auth-gated and dynamic,
  // so we opt out of Cache Components rather than wrap every page in a cache.
  cacheComponents: false,
  // PGlite (local embedded Postgres) ships WASM; keep it external, not bundled.
  serverExternalPackages: ["@electric-sql/pglite"],
  // Bundle the snapshot fonts + brand logos into the serverless functions that
  // read them from disk (the Satori renderer).
  outputFileTracingIncludes: {
    "/sellers/[id]/snapshot/image": [
      "./app/(app)/sellers/[id]/snapshot/image/fonts/*.woff",
      "./public/brand/*.png",
    ],
    "/sellers/[id]/snapshot/pdf": [
      "./app/(app)/sellers/[id]/snapshot/image/fonts/*.woff",
      "./public/brand/*.png",
    ],
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
