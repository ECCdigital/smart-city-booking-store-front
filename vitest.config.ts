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
  // Nuxt replaces `import.meta.server` at build time. Here it reads a global,
  // so a test can run app code the way it runs during server rendering by
  // setting `globalThis.__nuxtServer`. Unset, it stays falsy as before.
  define: {
    "import.meta.server": "globalThis.__nuxtServer",
  },
  test: {
    include: ["tests/**/*.test.{js,ts}"],
    environment: "node",
  },
});
