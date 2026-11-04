import { defineConfig } from "vitest/config";

// I test girano in Node puro: nessuna dipendenza da Next.js o dal DOM.
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
