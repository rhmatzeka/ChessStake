import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The engine loads the vendored Stockfish WASM from disk at runtime, so file tracing
  // cannot see it; bundle it explicitly with every route, since pages also resolve turns.
  outputFileTracingIncludes: {
    "/**/*": ["./vendor/stockfish/**/*"],
  },
};

export default nextConfig;
