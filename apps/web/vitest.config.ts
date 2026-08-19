import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Mirror the tsconfig path aliases without the ESM-only tsconfig-paths plugin
// (the config is loaded as CJS). Specific package aliases come before "@".
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@mentora/shared-types",
        replacement: resolve(__dirname, "../../packages/shared-types/src/index.ts"),
      },
      { find: "@mentora/ui", replacement: resolve(__dirname, "../../packages/ui/src/index.ts") },
      { find: /^@\//, replacement: `${resolve(__dirname, ".")}/` },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
  },
});
