import type { NextConfig } from "next"
import withSerwistInit from "@serwist/next"

const nextConfig: NextConfig = {}

// Serwist injects a webpack config, which clashes with Next 16's default
// Turbopack dev server. Only apply the wrapper for production builds.
const config =
  process.env.NODE_ENV === "production"
    ? withSerwistInit({
        swSrc: "src/sw.ts",
        swDest: "public/sw.js",
        reloadOnOnline: true,
      })(nextConfig)
    : nextConfig

export default config
