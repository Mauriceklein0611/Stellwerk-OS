import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Component/unit tests (Vitest + React Testing Library). Active from M2.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // Automated tests live in tests/<task-id>/ next to their testkonzept.md
    // (see CLAUDE.md "Test-Ordner & Testkonzept").
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    css: false,
    // Einige RTL/user-event-Dropdown-Interaktionen (@base-ui/react-Portale) sind
    // im jsdom-Timing gelegentlich flaky; ein knapper Retry stabilisiert sie,
    // analog zu den CI-Retries in playwright.config.ts. Kein App-/Testcode-Eingriff.
    retry: 2,
  },
  resolve: {
    alias: {
      // Mirror the "@/*" path alias from tsconfig.json.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
