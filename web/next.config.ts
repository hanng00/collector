import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  webpack: (config) => {
    // When importing TS files from `../shared`, module resolution would otherwise
    // look for dependencies (e.g. `zod`) relative to that external directory.
    // Force resolution to include this app's node_modules first.
    config.resolve ??= {};
    config.resolve.modules = [
      path.resolve(process.cwd(), "node_modules"),
      ...(config.resolve.modules ?? []),
    ];
    return config;
  },
  turbopack: {
    // Allow Turbopack to resolve files from `../shared` (repo root scope).
    root: path.resolve(process.cwd(), ".."),
    resolveAlias: {
      // Turbopack's alias targets must be project-relative (absolute paths break resolution).
      // This path is resolved relative to `turbopack.root` above.
      "@contracts": "./shared/contracts/index.ts",
    },
  },
};

export default nextConfig;
