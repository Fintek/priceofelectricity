import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  outputFileTracingExcludes: {
    "*": [
      ".data/**",
      "data/raw/**",
      "data/normalized/**",
      "scripts/**",
      "docs/**",
      "node_modules/typescript/**",
      "src/data/history.generated.ts",
      "src/data/snapshots/v1.json",
      "src/data/snapshots/v20260222.json",
      "src/data/snapshots/latest.json",
    ],
  },
};

export default nextConfig;