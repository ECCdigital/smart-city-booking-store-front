import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Only the framework-free parts of the app are unit tested, so this config
// deliberately does not boot Nuxt. It just mirrors the `~` / `~~` aliases so
// test files can import app modules the same way components do.
export default defineConfig({
  resolve: {
    alias: {
      "~~": fileURLToPath(new URL("./", import.meta.url)),
      "~": fileURLToPath(new URL("./app", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.{js,ts}"],
    environment: "node",
  },
});
