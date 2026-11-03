import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    include: ["src/**/*.int.test.ts"],
    exclude: ["**/node_modules/**"],
    fileParallelism: false,
  },
});
