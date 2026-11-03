import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The engine loads the vendored Stockfish WASM from disk at runtime, so file tracing
  // cannot see it; bundle it explicitly with every API route.
  outputFileTracingIncludes: {
    "/api/**/*": ["./vendor/stockfish/**/*"],
  },
};

export default nextConfig;
