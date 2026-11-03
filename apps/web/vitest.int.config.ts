import { defineConfig } from "vitest/config";
import path from "node:path";

const url = process.env.TEST_DATABASE_URL ?? "postgresql://postgres:pp@localhost:5544/postgres";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    include: ["src/**/*.int.test.ts"],
    exclude: ["**/node_modules/**"],
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 120_000,
    env: {
      TEST_DATABASE_URL: url,
      DATABASE_URL: url,
      DIRECT_URL: url,
      PAWNPOOL_ENGINE_BUDGET_MS: "150",
    },
  },
});
