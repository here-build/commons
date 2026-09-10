import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    allowOnly: false,
    include: ["src/__tests__/**/*.test.ts"],
  },
});
