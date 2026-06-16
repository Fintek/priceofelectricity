import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  // This site never uses next/image, next/og, or ImageResponse — only static
  // OpenGraph/Twitter meta image URLs. Disabling the optimizer guarantees sharp
  // is never required at runtime, which makes excluding its binaries (below)
  // provably safe. If image optimization is ever reintroduced, remove the
  // `@img`/`sharp` tracing excludes or the optimizer will throw at runtime.
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [{ source: "/knowledge-hub", destination: "/knowledge", permanent: true }];
  },
  outputFileTracingExcludes: {
    "*": [
      ".data/**",
      "data/raw/**",
      "data/normalized/**",
      "scripts/**",
      "docs/**",
      "node_modules/typescript/**",
      // ~16 MiB of platform image-processing binaries that file tracing pulls
      // into .next/standalone even though image optimization is disabled.
      "node_modules/@img/**",
      "node_modules/sharp/**",
      "src/data/history.generated.ts",
      "src/data/snapshots/v1.json",
      "src/data/snapshots/v20260222.json",
      "src/data/snapshots/latest.json",
    ],
  },
};

export default nextConfig;