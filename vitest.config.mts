import { defineConfig } from "vitest/config"

export default defineConfig({
  // Plasmo's tsconfig keeps JSX as is (`"jsx": "preserve"`) for its own
  // bundler; tests need it compiled.
  oxc: {
    jsx: { runtime: "automatic" }
  }
})
