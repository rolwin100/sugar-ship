import { defineConfig } from "vitest/config";

// Separate from vite.config.ts so tests don't load the Shopify / React Router plugins.
export default defineConfig({
  test: {
    include: ["app/**/*.test.ts"],
    environment: "node",
  },
});
